# PDF Contract

Status: verbindlich für TechCalc Pro 2.3.0
Stand: 2026-11-26 (Phase 49 Review-Runde 3, Report-Template `global-report-template-11-review-fixes`)

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
13. Identische Abschnittstitel innerhalb eines Dokuments bleiben unverändert; es wird kein `(i/n)`-Suffix angehängt (die Dedupe aus Phase 48 ist in Phase 49 Runde 3 zurückgezogen).
14. Generische Modul-PDFs enthalten weder einen Abschnitt `Berichtszusammenfassung` noch einen Abschnitt `Eingaben`; beide Metablöcke werden zentral nicht mehr erzeugt (autoritativen Engines wie EN 378, F-Gase und Überflutungsnachweis bleiben ausgenommen). Jeder Ergebnisabschnitt trägt den Namen der gespeicherten Berechnung; die generischen Titel `Leitungsabschnitt`, `Leitungsabschnitte` und `Gespeicherte Leitungsabschnitte` sind als Abschnittstitel unzulässig. Liefert ein Modul keinerlei Ergebnisabschnitte, erscheint stattdessen ein einzelner Abschnitt mit dem Titel des Berichts (ohne Nummerierung) und dem Status `Keine Ergebnisdaten verfügbar`.

Die Regeln 10 bis 13 bleiben gegenüber Version 2.1.0 unverändert; Regel 14 wurde in Phase 49 ergänzt, weil die Review-Nacharbeiten Abschnitte entfernen, die zuvor implizit im generischen Report-Pipeline erzeugt wurden. In Version 2.3.0 (Phase 49 Runde 3) wurde Regel 13 ersetzt: wiederholte Abschnittstitel bleiben ohne Suffix.
