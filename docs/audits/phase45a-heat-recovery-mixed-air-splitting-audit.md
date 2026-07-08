# Audit – Phase 45A: WRG/Mischluft Modulsplitting

## Audit-Ziel

Ermitteln, ob das bestehende Kombimodul `heat-recovery` mit vertretbarem Risiko in zwei Module getrennt werden kann.

## Geprüfte Referenzen

- `js/modules/heat-recovery/config.js`
- `js/modules/heat-recovery/state.js`
- `js/modules/heat-recovery/schema.js`
- `js/modules/heat-recovery/logic.js`
- `js/modules/heat-recovery/viewModel.js`
- `js/modules/heat-recovery/view.js`
- `js/modules/heat-recovery/dynamicRenderer.js`
- `js/modules/heat-recovery/results.js`
- `js/modules/heat-recovery/controller.js`
- `js/core/app.js`
- `js/core/projectStorage.js`
- `css/modules-wrg.css`
- `docs/contracts/module-contract.md`
- `docs/contracts/state-contract.md`
- `docs/contracts/pdf-contract.md`

## Befund

Das aktuelle Modul ist fachlich zweigeteilt, technisch aber ein gemeinsames Plattformmodul. Die Umschaltung erfolgt über `mode`. WRG und Mischluft haben getrennte State-Felder, getrennte Eingabegruppen und getrennte Ergebnisdarstellungen, teilen jedoch Berechnungshilfen, Renderer, dynamische Inseln, gespeicherte Datensätze und Persistenzpfad.

## Split-Komplexität

| Komponente | Split-Komplexität | Befund |
|---|---:|---|
| `config.js` | Niedrig | Neue Modulkonfiguration für Mischluft erforderlich. |
| `state.js` | Niedrig | State-Felder sind bereits fachlich trennbar. |
| `schema.js` | Niedrig bis Mittel | Segment `mode` entfällt; Feldgruppen werden zu Modulschemas. |
| `logic.js` | Mittel | Gemeinsame Luftzustandsfunktionen müssen shared bleiben. |
| `viewModel.js` | Mittel | Fachliche Gruppen sind vorhanden, aber gemeinsame Factory-Strukturen prüfen. |
| `view.js` | Mittel | Gemeinsames Layout muss in zwei Modulviews überführt werden. |
| `dynamicRenderer.js` | Mittel | `data-wrg-dynamic` und live Felder sind WRG-namensgebunden. |
| `results.js` | Mittel | Summary und Saved-Record-Normalisierung sind gemischt. |
| `controller.js` | Mittel | Actions und gespeicherte RLT-Geräte brauchen fachliche Zuordnung. |
| `projectStorage.js` | Hoch | Rückwärtskompatibilität bestehender `.tcproj`-Dateien ist entscheidend. |
| PDF/Export | Mittel | Ergebnisverträge je Zielmodul separat sichern. |

## Empfehlung

Freigabe für Phase 45B nur als Design Review. Keine Implementierung ohne vorherigen Migrations- und Modulvertrag.

## Akzeptanzkriterien für 45B

- Modul-IDs und Navigationsnamen sind entschieden.
- Shared-Bibliothek ist definiert.
- Migration von `modules['heat-recovery']` ist spezifiziert.
- Regressionreferenzen für WRG und Mischluft sind dokumentiert.
- PDF-/Export-Verhalten ist festgelegt.
- Saved-Records-Verhalten ist entschieden.
