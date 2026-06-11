# Phase 8 — Stabilisierung, Schema-Inventar und CSS-Konsolidierung

## Ziel

Phase 8 startet die eigentliche Plattform-Migration nach den Vorarbeiten aus Phase 1 bis 7. Der Fokus liegt nicht auf neuen Features, sondern auf Marktreife: jedes Modul muss seinen Formularvertrag offenlegen, Zahlenlogik zentral nutzen und verbleibende UI-/CSS-Sonderfälle messbar machen.

## Umgesetzt

### Modulverträge

- Alle 11 Module besitzen jetzt eine `schema.js`.
- Alle 11 Module exportieren das Schema über `index.js`.
- Alle 11 Modul-Konfigurationen sind auf `phase-8-schema-inventory` gesetzt.
- Alle 11 Module deklarieren `MODULE_CAPABILITIES.FORM_SCHEMA`.

Damit kann die App ab jetzt zentral prüfen, welche Felder ein Modul besitzt, welche Feldtypen verwendet werden und welche Module noch Legacy-Rendering verwenden.

### Zahlenlogik

Lokale Parser wurden entfernt bzw. auf `numberService.parse` umgestellt:

- h,x-Diagramm
- Lüftung
- Heizung/Kälte
- Trinkwasser

Der Plattform-Audit meldet dadurch `legacyNumberParsers: 0`.

### CSS und `!important`

- Doppelte Settings-Panel-Mobile-Blöcke wurden entfernt.
- Settings-Panel-Regeln wurden zusammengeführt.
- `components.css` wurde von 4.264 auf 4.222 Zeilen reduziert.
- `!important` über alle CSS-Dateien wurde von 81 auf 29 reduziert.
- Das Budget für `!important` wurde von 90 auf 35 verschärft.

### Audits

Neue Phase-8-Audit-Dateien:

- `module-contract-audit-phase8.json`
- `platform-migration-audit-phase8.json`
- `css-debt-audit-phase8.json`
- `important-usage-audit-phase8.json`

## Status nach Phase 8

| Bereich | Status |
|---|---:|
| Module gesamt | 11 |
| Module mit `defineModuleConfig` | 11 |
| Module mit `schema.js` | 11 |
| Module, die Schema exportieren | 11 |
| Legacy-Zahlenparser | 0 |
| `components.css` Zeilen | 4.222 |
| `!important` gesamt | 29 |
| Quality Gate | bestanden |

## Bewusst nicht erledigt

Phase 8 bedeutet noch nicht, dass alle Module vollständig generisch über `schemaModuleMount` gerendert werden. Die meisten Module exportieren jetzt ihren Vertrag, nutzen aber für Spezialfälle weiterhin Legacy-Renderer. Das ist gewollt, damit die App nicht in einem Big-Bang-Refactor destabilisiert wird.

## Nächster sinnvoller Schritt

Phase 9 sollte die echte UI-Migration starten:

1. Module mit geringem Spezialanteil zuerst auf `schemaModuleMount` umstellen.
2. Danach Saved-Record-Listen vollständig über zentrale Komponenten ersetzen.
3. Anschließend Legacy-CSS-Klassen je Modul entfernen.

Empfohlene Reihenfolge:

1. Einheitenrechner
2. Lüftung
3. Heizung/Kälte
4. Pufferspeicher
5. Druckhaltung
6. Trinkwasser
7. Regenwasser / Schmutzwasser
8. h,x-Diagramm zuletzt, weil die Diagramm-Visualisierung Spezial-CSS benötigt.
