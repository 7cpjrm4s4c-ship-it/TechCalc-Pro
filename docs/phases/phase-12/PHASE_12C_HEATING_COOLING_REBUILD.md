# Phase 12C - Heizung/Kälte Neuaufbau statt Patch

Ziel dieser Phase ist, den Heizung/Kälte-Pfad aus dem Hybridbetrieb zu lösen.

## Umgesetzt

- Modulinterner Interaktionsadapter entfernt.
- Segment-/Switch-Events werden zentral in `eventPipeline` verarbeitet.
- Mobile Segment-Aktionen committen bereits auf `pointerup`/`touchend`, nicht erst nach einem nachgelagerten Screen-Tap.
- Gespeicherte Leitungsabschnitte laufen über `data-tc-action` und zentrale Action-Registry.
- Legacy-Fallback `bindSavedRecordList` wurde im Heizung/Kälte-Modul entfernt, um doppelte Auswahl-/Toggle-Pfade zu vermeiden.
- Dynamische Feldänderungen aktualisieren nur dynamische Bereiche; statische Karten bleiben stehen.

## Abschlusskriterium

Heizung/Kälte gilt erst als vollständig globalisiert, wenn die nächste QA bestätigt:

- Medium übernimmt Stammdaten sofort.
- Rohrsystem übernimmt Stammdaten sofort.
- Heizung/Kälte-Switch reagiert sofort mobil und Desktop.
- Leistung/Massenstrom/Temperatur-Switch reagiert sofort mobil und Desktop.
- Massenstrom-Einheit kg/h/m³/h ist sichtbar und reagiert sofort.
- Speichern, Auswählen und Aktualisieren von Leitungsabschnitten funktioniert ohne Surface-Tap.
- Bei Eingaben flackert kein kompletter Modul-Reload.
