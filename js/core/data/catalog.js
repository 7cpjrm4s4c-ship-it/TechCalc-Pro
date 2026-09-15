import {
  areaTypes,
  dnOrder,
  hydraulicTables,
  roofDrainTable,
  gutterCombinations
} from './rainwater.js';
import { pipeSystems, dnTable, recommendPipe } from './pipes.js';
import { refrigerantService } from './refrigerants.js';

const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const freezeCatalogEntry = entry => Object.freeze({ ...entry });
const normalizeCatalogId = catalogId => String(catalogId ?? '').trim();

const builtInCatalogEntries = [
  {
    id: 'rainwater.areaTypes',
    label: 'Rainwater area types',
    version: 'repository',
    status: 'active',
    read: () => clone(areaTypes)
  },
  {
    id: 'rainwater.dnOrder',
    label: 'Rainwater nominal diameter order',
    version: 'repository',
    status: 'active',
    read: () => clone(dnOrder)
  },
  {
    id: 'rainwater.hydraulicTables',
    label: 'Rainwater hydraulic tables',
    version: 'repository',
    status: 'active',
    read: () => clone(hydraulicTables)
  },
  {
    id: 'rainwater.roofDrainTable',
    label: 'Rainwater roof drain table',
    version: 'repository',
    status: 'active',
    read: () => clone(roofDrainTable)
  },
  {
    id: 'rainwater.gutterCombinations',
    label: 'Rainwater gutter combinations',
    version: 'repository',
    status: 'active',
    read: () => clone(gutterCombinations)
  },
  {
    id: 'pipes.systems',
    label: 'Pipe systems',
    version: 'repository',
    status: 'active',
    read: () => clone(pipeSystems)
  },
  {
    id: 'pipes.dnTable',
    label: 'Pipe nominal diameter table',
    version: 'repository',
    status: 'active',
    read: () => clone(dnTable)
  },
  {
    id: 'refrigerants.items',
    label: 'Refrigerants',
    version: () => refrigerantService.getDataVersions().refrigerants,
    status: () => refrigerantService.getDataStatus().refrigerants,
    read: () => refrigerantService.listRefrigerants()
  },
  {
    id: 'refrigerants.safetyClasses',
    label: 'Refrigerant safety classes',
    version: () => refrigerantService.getDataVersions().safetyClasses,
    status: () => refrigerantService.getDataStatus().safetyClasses,
    read: () => refrigerantService.listSafetyClasses()
  },
  {
    id: 'refrigerants.regulations',
    label: 'Refrigerant regulations',
    version: () => refrigerantService.getDataVersions().regulations,
    status: () => refrigerantService.getDataStatus().regulations,
    read: () => refrigerantService.listRegulations()
  },
  {
    id: 'refrigerants.en378SafetyData',
    label: 'EN 378 refrigerant safety data',
    version: () => refrigerantService.getDataVersions().en378SafetyData,
    status: () => refrigerantService.getDataStatus().en378SafetyData,
    read: () => refrigerantService.listEN378SafetyData()
  }
];

export function defineDataCatalogEntry(entry = {}) {
  const id = normalizeCatalogId(entry.id);
  if (!id) throw new Error('Data catalog entry requires an id');
  if (typeof entry.read !== 'function') throw new Error(`Data catalog entry "${id}" requires a read function`);

  return freezeCatalogEntry({
    id,
    label: String(entry.label || id),
    version: entry.version ?? 'repository',
    status: entry.status ?? 'active',
    read: entry.read
  });
}

export function createDataCatalog(entries = builtInCatalogEntries) {
  const catalogs = new Map();

  function register(entry) {
    const catalogEntry = defineDataCatalogEntry(entry);
    if (catalogs.has(catalogEntry.id)) throw new Error(`Data catalog entry already registered: ${catalogEntry.id}`);
    catalogs.set(catalogEntry.id, catalogEntry);
    return catalogEntry;
  }

  function getEntry(catalogId) {
    const id = normalizeCatalogId(catalogId);
    const entry = catalogs.get(id);
    if (!entry) throw new Error(`Unknown data catalog entry: ${id || '<empty>'}`);
    return entry;
  }

  function resolveMetadata(value) {
    return typeof value === 'function' ? value() : value;
  }

  for (const entry of entries) register(entry);

  return Object.freeze({
    register,
    list() {
      return Object.freeze([...catalogs.values()].map(entry => Object.freeze({
        id: entry.id,
        label: entry.label,
        version: resolveMetadata(entry.version),
        status: resolveMetadata(entry.status)
      })));
    },
    has(catalogId) {
      return catalogs.has(normalizeCatalogId(catalogId));
    },
    read(catalogId) {
      return getEntry(catalogId).read();
    },
    getVersion(catalogId) {
      return resolveMetadata(getEntry(catalogId).version);
    },
    getStatus(catalogId) {
      return resolveMetadata(getEntry(catalogId).status);
    },
    getPipeSystems() {
      return clone(pipeSystems);
    },
    recommendPipe,
    getRefrigerants() {
      return refrigerantService.listRefrigerants();
    },
    getRefrigerant(refrigerantId) {
      return refrigerantService.getRefrigerant(refrigerantId);
    },
    getRainwaterAreaTypes() {
      return clone(areaTypes);
    }
  });
}

export const dataCatalog = createDataCatalog();

export default dataCatalog;
