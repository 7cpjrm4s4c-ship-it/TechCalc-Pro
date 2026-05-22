# Release Notes

## 1.1.1 - Schmutzwasser UX und Fallleitungslogik
- Entwässerungsgegenstände als Klappcards umgesetzt.
- Leitungsart-Auswahl für Einzel-/Sammelanschluss mit Vorwahl belüftet/unbelüftet vereinfacht.
- Fallleitungen mit angeschlossenem WC setzen nun mindestens DN 100 an.
- Version und Cache auf 1.1.1 erhöht.

## 1.1.0 - Neues Modul Schmutzwasser

- Neues Modul „Schmutzwasser“ als eigenständiger Sanitär-Rechner nach DIN 1986-100 angelegt.
- DU-Katalog, Nutzung/K-Abflusskennzahl, Qww-/Qtot-Berechnung und Zusatzabflüsse integriert.
- Leitungstypen für Einzelanschluss-, Sammelanschluss-, Fall-, Sammel-, Grund- und Lüftungsleitungen vorbereitet.
- Tabellenlogik für Sammelanschlussleitungen, Fallleitungen und hydraulische Vorbemessung über Tabellen A.3 bis A.5 integriert.
- Speicher-/Auswahl-/Aktualisieren-Logik gemäß globaler Saved-Card-Systematik umgesetzt.
- Version und Cache auf 1.1.0 erhöht.

## 1.0.13 - Debug Hotfix

- Heizung: Laden gespeicherter Leitungsabschnitte übernimmt Eingabewerte nun robust aus normalisierten und älteren gespeicherten Datensätzen.
- Lüftung: Laden gespeicherter Leitungsabschnitte befüllt die Eingaben wieder zuverlässig, inklusive Betriebsart und Temperaturen.
- WRG: Beim Laden gespeicherter RLT-Geräte wird die gespeicherte Berechnungsart WRG/Mischluft wieder auf den Switch übertragen.
- Trinkwasser: Gespeicherte Einzelverbraucher werden bei Auswahl auch aus älteren Datenstrukturen in den aktiven Entwurf und die Zusammenstellung übernommen.

## 1.0.12 - Debug Hotfix
- Heizung: Laden gespeicherter Abschnitte robust gegen ältere Record-Strukturen gemacht.
- Lüftung: Auswahl gespeicherter Objekte stabilisiert und Fallback für ältere Datensätze ergänzt.
- WRG: Auswahl gespeicherter RLT-Geräte stabilisiert und Event-Zuordnung gehärtet.
- h,x: Aktiven Prozess durch Klick außerhalb der Prozess-/Eingabebereiche abwählbar gemacht.
- Druck: Desktop-Overflow der Beschriftung „Auswahl Station / Gefäß“ in Ergebnis-Kacheln korrigiert.
- Trinkwasser: Auswahl gespeicherter Einzelverbraucher mit robuster ID-Zuordnung und direkter Übernahme in die Zusammenstellung abgesichert.

## 1.0.11 - Debug Hotfix

- Heizung: Auswahl gespeicherter Leitungsabschnitte lädt die gespeicherten Eingaben robuster und erlaubt erneutes Abwählen.
- Lüftung: Auswahl gespeicherter Leitungsabschnitte stabilisiert; erneutes Tippen auf aktive Card hebt die Auswahl auf.
- WRG: Auswahl gespeicherter RLT-Geräte stabilisiert; aktive Card kann erneut abgewählt werden.
- h,x: aktive Prozesse können durch erneutes Antippen abgewählt werden, damit wieder neue Prozesse angelegt werden können.
- Druckhaltung: Ergebnisbeschriftung „Station / Gefäß“ gekürzt und Overflow-Schutz ergänzt.
- Puffer: Beim Abwählen einer gespeicherten Card werden die Eingabefelder geleert.
- Trinkwasser: Einzelverbraucher-Auswahl lädt sauber in Bearbeitung und Zusammenstellung; Auswahl-Handler bricht danach korrekt ab.
- Navigation: Modulauswahlleiste bleibt auf Desktop/Tablet fix unterhalb des Headers, Content läuft dahinter durch.
