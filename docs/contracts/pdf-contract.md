# PDF Contract

Status: verbindlich für TechCalc Pro 1.5.0
Stand: 2026-08-28

## Ziel
PDF-Ausgaben werden regelbasiert erzeugt und dürfen keine modulspezifischen Layout-Hotfixes enthalten.

## Regeln
1. Seitenumbrüche werden zentral gesteuert.
2. Tabellen, Fortsetzungen und Abschnittstitel folgen dem zentralen PDF-Renderer.
3. Standardtabellen verwenden ein einheitliches Vier-Spalten-Raster `Bezeichnung | Wert | Bezeichnung | Wert` mit den zentralen `PDF_GRID`-Breiten.
4. Bezeichnungen sind linksbündig, Werte rechtsbündig. Beide Zelltypen dürfen mehrzeilig wachsen; die Zeilenhöhe folgt dem größten Textblock.
5. Der Textumbruch verwendet die Metrik der tatsächlich gerenderten PDF-Schrift. Normale Wörter werden nicht willkürlich zeichenweise getrennt; technische Tokens dürfen an vorhandenen semantischen Trennzeichen umbrechen.
6. Diagramme und Bilder werden skaliert, ohne Seiten- oder Bezugskanten zu verletzen.
7. Sonderzeichen werden zentral normalisiert.
8. Ein abweichender Dokumenttitel wird über Report-Metadaten geliefert; das zentrale Layout enthält keine Modul-ID-Sonderbehandlung.
9. Neue PDF-Sonderfälle müssen über den PDF-Vertrag oder Renderer gelöst werden, nicht über Modul-Patches.
