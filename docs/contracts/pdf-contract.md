# PDF Contract

Status: verbindlich für TechCalc Pro 2.1.0
Stand: 2026-11-25 (Phase 48, Report-Template `global-report-template-10-unified-module-output`)

## Ziel
PDF-Ausgaben werden regelbasiert erzeugt und dürfen keine modulspezifischen Layout-Hotfixes enthalten. Alle Module erzeugen ein einheitliches Dokumentbild.

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
10. Dokumenttitel: Rechenmodule verwenden durchgängig den Titel `Berechnungsprotokoll`. Abweichende Titel sind autoritativen oder dokumentartigen Berichten vorbehalten und werden über Report-Metadaten geliefert (`Behördennachweis` für Überflutungsnachweis, `Informationsblatt` für F-Gase, `Sicherheitsdatenblatt`/`Sicherheitsbericht` für EN 378).
11. Kopfzeilen: Der volle Kopfbereich inklusive Projekt-Metadatenblock erscheint ausschließlich auf der ersten Seite. Jede Folgeseite erhält für jedes Modul denselben kompakten Fortsetzungsbalken (Marke, Berichtstitelzeile, Trennlinie).
12. Einheitlicher Abschnittsstil: Jeder reguläre Abschnitt wird mit derselben zentralen Standarddarstellung (Akzentüberschrift + Tabelle im Vier-Spalten-Raster) gerendert. Nur inhalts-spezifische Blocktypen (Hinweise-Block im 1:3-Layout, vollbreite Zusammenstellungen) nutzen dedizierte zentrale Renderer; ein Modul darf keinen eigenen Abschnittsstil wählen.
13. Identische Abschnittstitel innerhalb eines Dokuments werden zentral eindeutig gemacht (Suffix `(i/n)`); einmalige Titel bleiben unverändert.
