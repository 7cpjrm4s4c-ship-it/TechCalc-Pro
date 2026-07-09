# PDF Contract

Status: bestaetigt durch RC.11/RC.11.1

## Ziel

PDF-Ausgaben werden regelbasiert erzeugt und duerfen keine modulspezifischen Layout-Hotfixes enthalten.

## Regeln

1. Seitenumbrueche werden zentral gesteuert.
2. Tabellen, Fortsetzungen und Abschnittstitel folgen dem zentralen PDF-Renderer.
3. Label/Wert-Trennung bleibt erhalten.
4. Diagramme und Bilder werden skaliert, ohne rechte Bezugskanten zu verletzen.
5. Sonderzeichen werden zentral normalisiert.
6. Neue PDF-Sonderfaelle muessen ueber den PDF-Vertrag oder Renderer geloest werden, nicht ueber Modul-Patches.
