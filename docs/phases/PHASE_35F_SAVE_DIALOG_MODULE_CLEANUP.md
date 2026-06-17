# Phase 35F – Save Dialog Module Cleanup

## Ziel

Druckhaltung, Schmutzwasser und Regenwasser wurden auf das Single-Controller-Pattern der funktionierenden Referenzmodule ausgerichtet.

## Entscheidung

Die Speicherlogik darf nicht mehr parallel in Modul-Controller-Objekten und in `createLineSectionController()` existieren. Pro Modul ist ein zentraler Save-Controller zulässig.

## Änderungen

- `pressure-holding` nutzt ausschließlich `pressureHoldingSavedController`.
- `wastewater` nutzt ausschließlich `wastewaterSavedController`.
- `rainwater` nutzt ausschließlich `rainwaterSavedController`.
- Legacy-`controller.savedRecords`-Stubs wurden aus Schmutzwasser und Regenwasser entfernt.
- Legacy-Kompatibilitätsmarker in Druckhaltung wurden entfernt.
- Bind-Funktionen in Schmutzwasser/Regenwasser wurden auf Plattform-Namen umgestellt:
  - `bindWastewaterPlatform`
  - `bindRainwaterPlatform`
- Alte Tests wurden auf das aktuelle Single-Controller-Pattern angepasst.
- Neuer Regressionstest: `test:phase35f`.

## Verifikation

- `npm run build` OK
- `npm run audit:css` OK
- `npm run test:phase35f` OK
- `npm test` OK

## Hinweis

Diese Phase entfernt konkurrierende Speicherpfade. Sie ersetzt keine manuelle Browser-Verifikation der konkreten UI-Bugs, reduziert aber die Hauptursache für doppelte Klicks, deaktivierte Speicherbuttons und konkurrierende Eventpfade.
