## Version 1.6.1 – PDF Adapter Unification
### Verbesserungen
- Die Typed-DTO-PDF-Abschnittserzeugung verwendet jetzt eine zentrale Builder-Registrierung.
- Überflutungsnachweis, Regenwasser und F-Gase-Check laufen über denselben zentralen PDF-Dispatchpfad.
- Der bisherige Sonderpfad für den Überflutungsnachweis wurde entfernt, ohne den Legacy-DOM-Fallback zu verändern.
### Qualität
- Regressionstest für die zentrale PDF-Engine-Dispatchlogik ergänzt und in das Fast-Test-Gate aufgenommen.

## Version 1.6.0 – EN 378 Sicherheitscheck
### Neu
- EN-378-Sicherheitscheck als eigenständiges Modul für die sicherheitstechnische Bewertung von Kälte-, Klima- und Wärmepumpenanlagen integriert.
- Import gespeicherter Anlagen-Snapshots aus dem F-Gase-Check ergänzt; importierte Daten werden als Kopie in der EN-378-Bewertung verwendet.
- Bewertung von Kältemittel, Füllmenge, Raumvolumen, Aufstellort, Zugangsbereich, Nutzung, Lüftung und Sicherheitsmaßnahmen ergänzt.
- EN-378-Füllmengenbewertung nach Anhang C mit getrennten Prüfpfaden für Toxizität, Brennbarkeit und alternative Risikomaßnahmen integriert.
- Planer-Leitfaden mit erforderlichen Maßnahmen, offenen Prüfpunkten und Hinweisen zur Aufstellung, Lüftung, Detektion, Alarmierung und Dokumentation ergänzt.
- PDF-Bericht für EN-378-Bewertungen über den zentralen PDF-Reportpfad integriert.
### Verbesserungen
- Kältemittelplattform um EN-378-Sicherheitsdaten, praktische Grenzwerte, ATEL/ODL-, LFL-, QLMV- und QLAV-Daten erweitert.
- Projektpersistenz für F-Gase-Anlagen-Snapshots und EN-378-Bewertungen über den zentralen Projektmodul-Adapter ergänzt.
- Saved-record-Darstellung für F-Gase und EN 378 an den zentralen Renderer und die bestehenden UI-Zustände angeglichen.
- Ausgaben in UI und PDF auf deutsche Volltextbezeichnungen ohne interne Schlüssel stabilisiert.
- Mobile Darstellung und kontextabhängige Eingabebereiche für EN 378 verbessert.
### Behoben
- Gespeicherte F-Gase-Anlagen-Snapshots werden nun in Projektdaten übernommen und nach dem Laden wieder bereitgestellt.
- EN-378-Bewertungen behalten importierte Anlagenstände, gespeicherte Bewertungseinträge und PDF-Daten projektübergreifend bei.
- Der bestehende Flooding-Projektadaptervertrag bleibt trotz zusätzlicher Moduladapter unverändert erhalten.

## Version 1.5.1 – PDF-Branding
### Neu
- TechCalc-Pro-Branding kann in den Projekteinstellungen für den PDF-Export gezielt ein- oder ausgeblendet werden.
- Die Einstellung ist standardmäßig aktiviert und wird projektbezogen gespeichert; bestehende Projekte behalten damit das bisherige PDF-Verhalten.
### Verbesserungen
- Bei deaktiviertem Branding werden TechCalc-Pro-Icon, Produktname und „HLSK QUICK TOOLS“ durchgängig aus dem PDF entfernt – einschließlich Deckblatt und Inhaltsverzeichnis des Überflutungsnachweises.
- Das Firmenlogo bleibt unabhängig von der TechCalc-Pro-Branding-Option im PDF erhalten.
- Die Branding-Option wird als kompakter iOS-orientierter Toggle-Switch dargestellt und ist für Light und Dark Mode abgestimmt.
- Tastaturfokus und bestehende Bedienbarkeit der PDF-Einstellungen bleiben erhalten.
## Version 1.5.0 – F-Gase-Check

### Neu
- F-Gase-Check für Kälte-, Klima- und Wärmepumpenanlagen integriert.
- Gemeinsame Kältemittelplattform mit GWP-, Sicherheitsklassen- und regulatorischen Daten ergänzt.
- Regulatorische Prüfung für Inverkehrbringen, Service, Dichtheitskontrolle, Leckage-Erkennung, Dokumentation, Zertifizierung und Betreiberpflichten ergänzt.
- Versionierte Anlagen-Snapshots, Saved Records und PDF-Ausgabe integriert.
### Verbesserungen
- Regulatorische Zeitbezüge für Inverkehrbringen, Inbetriebnahme und Bestandsprüfung getrennt.
- Kältemittel werden bevorzugt mit R-Bezeichnungen dargestellt.
- PDF-Tabellen verwenden zentral ein einheitliches Vier-Spalten-Raster mit mehrzeiligem Umbruch.
- Zentraler PDF-Textumbruch verhindert willkürliche Einzelbuchstaben-Trennungen.
- Tastaturnavigation bei Select-Feldern über dynamische Renderzyklen stabilisiert.
### Behoben
- Leere Kältemittelzustände können das F-Gase-Modul nicht mehr beim Laden abbrechen.
- Hermetische Ausnahme nach § 2 Abs. 3 ChemKlimaschutzV wird nur bei erfülltem Status und Kennzeichnung angewendet.
- Service- und Quotenhinweis sind fachlich getrennt und konsistent beschriftet.

## Version 1.4.0 – Final Release
### Freigabe
TechCalc Pro 1.4.0 ist als Produktionsversion freigegeben. Der Überflutungs- und Rückhaltenachweis sowie alle zugehörigen Qualitäts-, Plattform- und PDF-Arbeiten sind abgeschlossen.
### Neu
- Überflutungs- und Rückhaltenachweis als eigenständiges Fachmodul vollständig integriert.
- DIN-1986-100-Nachweis, bedingte DWA-A-117-Rückhaltebemessung und Dauerstufenvergleich ergänzt.
- Flächen-Snapshot-Import aus dem Regenwassermodul ohne Rückschreibung umgesetzt.
- Professionelle Diagnostik, Plausibilitätsprüfung und Ergebnisinterpretation ergänzt.
- Behörden-PDF mit Deckblatt, Inhaltsverzeichnis, Tabellen, Diagrammen und Pagination fertiggestellt.
### Verbesserungen
- Zentraler Modul-, Layout- und Spacing-Vertrag über alle Module vereinheitlicht.
- Browser-, Viewport-, Theme-, Offline-, Projekt- und PDF-Regression erweitert.
- Mischluft-, WRG- und Legacy-Projektlebenszyklus stabilisiert.
