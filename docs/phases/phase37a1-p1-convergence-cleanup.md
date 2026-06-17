# Phase 37A.1 – P1 Platform Convergence Cleanup

Ziel: die in Phase 37A identifizierten P1-Findings schließen, ohne Runtime-Verhalten fachlich zu verändern und ohne Feature-Arbeit zu starten.

## Änderungen

### Rainwater · Event-Boundary

- Der Dacheinlauf-Precommit-Pfad bleibt fachlich unverändert.
- Die Listener-Registrierung wurde aus `js/modules/rainwater/index.js` entfernt.
- Die Verantwortung liegt jetzt in `js/modules/rainwater/controller.js` über `bindRainwaterController()`.
- Wichtig: Die Listener bleiben auf `document` im Capture-Pfad, damit der Drain-Patch weiterhin vor der zentralen Root-Pipeline im State liegt.

### Unit Converter · Module Contract

- `js/modules/unit-converter/controller.js` ergänzt.
- `index.js` importiert und übergibt den Controller an `createPlatformModule()`.
- Der Controller enthält aktuell keine Modul-Sonderlogik; er fixiert den Plattform-Contract und macht künftige Actions explizit.

## Audit-Ergebnis nach 37A.1

- P1-Findings: 0
- P2-Findings: 17
- Rainwater Score: 93
- Unit Converter Score: 86

## Validierung

- `npm run build` ✅
- `npm run test:phase37a` ✅
- `npm run test:phase37a1` ✅
- `npm run test:module-smoke` ✅ 11/11

## SVP-Bewertung

37A.1 ist bewusst klein gehalten. Die Phase schließt die harten Konvergenzrisiken, ohne neue Architektur einzuführen. Die verbleibenden Punkte sind P2: Runtime-Metadaten, CSS-Spezialisierungen, Event-Dichte und Utility-Kandidaten. Damit ist die Plattform-Konvergenz wieder unter Kontrolle; die nächste sinnvolle Runde ist 37A.2 als P2-Metadaten- und Utility-Cleanup.
