## Nächste Entwicklungsphase – Regenwassereinläufe, BTU/h und h,x-Diagramm

### Neu
- Auswahl „Herstellerangaben“ als letzter Eintrag bei Dacheinläufen und Hoftöpfen ergänzt.
- Freie Eingabe von Hersteller/Produkt, DN, Abflusswert und Anstauhöhe ermöglicht.
- Herstellerwerte werden in Berechnung, Ergebnisdarstellung und gespeicherten Regenflächen durchgängig erhalten.
- Leistungseinheit `BTU/h` mit dem Umrechnungsfaktor `1 BTU/h = 0,2930710701722 W` im Einheitenrechner ergänzt.

### Qualität
- Bestehende Standardvorwahlen bleiben rückwärtskompatibel.
- Unvollständige Herstellerdaten werden durch Plausibilitätshinweise kenntlich gemacht.
- Automatisierte Regressionstests für Auswahl, Berechnung und Leerzustand ergänzt.
- Vorwärts- und Rückwärtsumrechnung sowie Anzeige von `BTU/h` sind automatisiert abgesichert.

### Behoben
- Dampf- und adiabate Befeuchtung erzeugen bei einem gegenüber dem Ausgangszustand niedrigeren Zielfeuchtegehalt keine physikalisch unmögliche negative Befeuchtung mehr.
- In diesem Fall zeigt das Diagramm ausschließlich die mögliche Beheizungskennlinie und den Hinweis „Befeuchtung nicht möglich“.
- Die Fallback-Kennlinie und beide Befeuchtungsvarianten sind durch einen automatisierten Regressionstest abgesichert.

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

### Qualitätsstatus
- GitHub Actions `Playwright Tests` Run #193 erfolgreich.
- Automatisierte und manuelle Phase-47-Gates vollständig bestanden.
- Enterprise-/QM-Freigabe am 23.07.2026 erteilt.
- Keine offenen blockierenden Befunde.

### Produktionsstatus
TechCalc Pro 1.4.0 ist für den produktiven Einsatz freigegeben.
