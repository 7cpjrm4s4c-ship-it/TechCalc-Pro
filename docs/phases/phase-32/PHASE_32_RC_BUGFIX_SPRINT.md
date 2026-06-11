# Phase 32 – RC Bugfix Sprint

Basis: `1.3.0-rc.1`

## Ziel

Releasekritische RC-Befunde aus der manuellen Prüfmatrix stabilisieren, ohne neue Features oder größere Architekturänderungen einzuführen.

## Umgesetzte Korrekturen

### HX-Diagramm

- Vorzeichen-Toggle schreibt den Wert jetzt unmittelbar in das aktive Eingabefeld und in den Store.
- `Diagramm leeren` leert DOM-Felder und Store synchron.
- Clear-Action zusätzlich über zentrale Action-Registry abgesichert.

### Trinkwasser

- Enter-/Tab-Navigation in der modulalen Eingabelogik ergänzt.
- Mobile Hinzufügen-Aktion für Verbraucher reagiert bereits auf Pointer-/Touch-Start und commitet sichtbare Felder vor dem Hinzufügen.
- Deduplizierung verhindert doppeltes Hinzufügen nach Pointer-/Click-Kaskaden.

### Druckhaltung

- Speicher-Dialog im Desktop-Layout direkt nach `Berechnungsart` angeordnet.
- Bestehende zentrale Saved-Record-Actions bleiben unverändert aktiv.

### UI-Hardening global

- Lange Ergebnis- und Kartentexte brechen jetzt innerhalb der Cards um.
- Ergebnis-/Saved-Record-Abstände wurden über globale Card-/Stack-Regeln geglättet.
- Trinkwasser-Felder in den Save-Dialogen haben eine einheitliche Mindesthöhe.

## Verifikation

- `npm run build`: OK
- `npm run audit:imports`: OK
- `npm test`: OK

## Hinweis

Die Phase behebt die ersten P1/P3-Cluster. Nicht alle aus der vollständigen Bugliste gemeldeten Punkte sind damit automatisch abgeschlossen; verbleibende Punkte sind in nachfolgenden 32.x-Batches zu prüfen.
