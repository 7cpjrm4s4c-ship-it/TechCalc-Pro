# Phase 47C.8.1 – UI- und Design-Harmonisierung

## Ziel

Das Modul `flooding-verification` verwendet ausschließlich die zentralen Form-, Result-, Saved-Record- und Theme-Verträge. Fachlogik, Berechnung und Persistenz bleiben unverändert.

## Umgesetzte Harmonisierung

- Flächenarten werden wie im Regenwassermodul nach Dach- und Grundstücksflächen getrennt angeboten.
- Selects, Segmente, Inputs, Actions, Notices und Stats werden ausschließlich über das zentrale Form-Schema erzeugt.
- Der allgemeine DWA-A-117-Hinweis wurde vom rohen `afterHtml`-Pfad auf `FIELD_TYPES.NOTICE` migriert.
- Zentrale Schema-Hinweise, Aktionen und Statistikblöcke belegen in mehrspaltigen Formularen immer die gesamte Rasterbreite.
- Modulfarbe, Cards, Abstände, Fokus-, Hover-, Disabled- und Theme-Zustände bleiben vollständig über zentrale Tokens und Komponenten geregelt.
- Deutsche Silbentrennung bleibt Bestandteil des globalen UI-Polish-Contracts.
- Die bestehenden moduleigenen Responsive-Regeln beschränken sich auf notwendige Ergebnislayouts und definieren keine parallelen Komponenten.

## Regression

Der Test `tests/flooding-verification-phase47c81-ui-harmonization.test.mjs` prüft:

1. identische Dach-/Grundstücksfilterung wie im Regenwassermodul,
2. Nutzung des zentralen Notice-Contracts anstelle von rohem HTML,
3. den zentralen Vollbreiten-Contract für Notices, Actions und Stats.

Der Test ist im verbindlichen Gate `npm run test:flooding` registriert.

## Abnahme

47C.8.1 ist technisch abgeschlossen, wenn:

- der Deploy grün ist,
- die Form- und Result-Komponenten in Light, Dark und System ausschließlich zentrale Styles verwenden,
- keine fachliche Regression im vollständigen Überflutungsnachweis-Gate auftritt,
- die visuelle Geräteprüfung keine weiteren Abweichungen gegenüber den Referenzmodulen zeigt.
