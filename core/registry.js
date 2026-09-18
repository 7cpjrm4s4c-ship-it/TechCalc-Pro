import { assertModuleRegistrationContract, moduleContractSummary, MODULE_CONTRACT_VERSION } from './moduleDefinition.js';

const REQUIRED_META_FIELDS = ['id', 'title', 'shortTitle', 'group', 'accent'];

class ModuleRegistry {
  constructor() {
    this.modules = new Map();
  }

  /**
   * Register a module.
   * Supported signatures:
   *   modules.register(module)
   *   modules.register(id, module)
   *
   * A module may expose metadata either directly or via module.config.
   * The registry normalizes metadata to the top level so navigation,
   * router and render systems never need to know the module internals.
   */
  register(idOrModule, maybeModule) {
    const source = maybeModule ?? idOrModule;
    const config = { ...(source?.config ?? {}), ...(source?.meta ?? {}) };
    const id = typeof idOrModule === 'string' ? idOrModule : config.id;

    const normalized = this.#normalizeModule(id, source, config);
    assertModuleRegistrationContract(normalized);

    if (this.modules.has(normalized.id)) {
      throw new Error(`Module id doppelt registriert: ${normalized.id}`);
    }

    this.modules.set(normalized.id, Object.freeze(normalized));
    return normalized;
  }

  get(id) {
    return this.modules.get(id) ?? null;
  }

  has(id) {
    return this.modules.has(id);
  }

  all() {
    return [...this.modules.values()].sort((a, b) => {
      const orderA = Number.isFinite(a.order) ? a.order : 999;
      const orderB = Number.isFinite(b.order) ? b.order : 999;
      return orderA - orderB || a.title.localeCompare(b.title, 'de');
    });
  }

  meta(id) {
    const module = this.get(id);
    if (!module) return null;
    const { mount, module: source, ...metadata } = module;
    return metadata;
  }

  contractReport() {
    return this.all().map(module => moduleContractSummary(module));
  }

  #normalizeModule(id, source, config) {
    const meta = {
      id,
      title: config.title,
      shortTitle: config.shortTitle ?? config.title,
      group: config.group ?? config.category ?? 'Module',
      accent: config.accent ?? 'blue',
      order: Number.isFinite(config.order) ? config.order : 999,
      defaultVisible: config.defaultVisible !== false,
      description: config.description ?? '',
      icon: config.icon ?? null,
      contractVersion: config.contractVersion ?? MODULE_CONTRACT_VERSION,
      migrationStatus: config.migrationStatus ?? 'legacy',
      capabilities: Array.isArray(config.capabilities) ? [...config.capabilities] : [],
    };

    for (const field of REQUIRED_META_FIELDS) {
      if (!meta[field]) {
        throw new Error(`Modul-Metadaten unvollständig: Feld "${field}" fehlt.`);
      }
    }

    if (typeof source?.mount !== 'function') {
      throw new Error(`Modul "${meta.id}" besitzt keine mount(app)-Funktion.`);
    }

    return {
      ...meta,
      config: Object.freeze({ ...meta }),
      mount: source.mount,
      module: source,
    };
  }
}

export const modules = new ModuleRegistry();
