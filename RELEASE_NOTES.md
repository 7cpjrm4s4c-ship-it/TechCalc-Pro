## Version 1.2.18 - ASCII / Hosting Compatibility Hotfix

- Unicode-Zeichen in Code und Textressourcen auf ASCII umgestellt.
- Umlaute und Sonderzeichen in Quelltexten transliteriert.
- Versionsnummer und Cache auf 1.2.18 erhoeht.
- Ziel: robuste GitHub-/CI-/Hosting-Kompatibilitaet ohne versteckte Unicode-Zeichen.

## Version 1.2.18 - Hosting / Darstellung Hotfix

- Release Notes werden im Menue dynamisch mit Versionsparameter und `cache: no-store` geladen.
- Service Worker behandelt `RELEASE_NOTES.md`, `index.html` und Navigationsanfragen netzwerkpriorisiert, damit gehostete Updates sichtbar werden.
- Netlify-Header fuer `index.html`, `service-worker.js` und `RELEASE_NOTES.md` ergaenzt.
- Darstellungseinstellungen im Menue werden dauerhaft ueber `localStorage` gespeichert und nach dem Schliessen der App wiederhergestellt.

## Version 1.2.16 - Release Notes / Link-State Hotfix

- Release Notes im Menue auf den aktuellen Stand gebracht.
- Regenwasser-Status wird vor dem Oeffnen externer KOSTRA/OpenKo-Links gesichert.
- Mobile Schnellzugriffe werden dauerhaft gespeichert.
- Eingestellte Werte, markierte Flaechen und Flaechenliste bleiben nach Rueckkehr aus externen Links erhalten.

## Version 1.2.15 - Regenwasser Flaechen-UX Hotfix

- Gespeicherte Regenwasser-Berechnungen Card entfernt.
- Markierungsrahmen wird nur noch bei aktiv ausgewaehlter Flaeche angezeigt.
- Flaechenarten nach Dachflaechen und Hofflaechen getrennt.
- Scroll-Spruenge bei Auswahl/Bearbeitung von Regenflaechen weiter stabilisiert.

## Version 1.2.14 - Regenwasser/Trinkwasser Interaktion Hotfix

- Regenwasser: Scroll-Spruenge bei Flaechenauswahl reduziert.
- Regenwasser: erneutes Antippen einer markierten Flaeche hebt die Markierung auf.
- Regenwasser: Flaechenliste aus der Eingabe-Card entfernt, um doppelte Darstellung zu vermeiden.
- Regenwasser: Aktualisieren-Button fuer nachtraegliche Flaechenkorrekturen ergaenzt.
- Regenwasser: Flaechenaenderungen werden erst nach aktiver Quittierung uebernommen.
- Trinkwasser: Auswahl freier Verbraucher von aktiven Nutzungseinheiten entkoppelt.

## Version 1.2.13 - Trinkwasser/Regenwasser Interaktion Hotfix
- Trinkwasser: gespeicherte Nutzungseinheiten und freie Einrichtungsgegenstaende wieder per Klick auswaehlbar.
- Regenwasser: gespeicherte Eintraege bleiben beim Antippen geschlossen und oeffnen nur ueber den Pfeil.
- Regenwasser: Pfeil-Optik der gespeicherten Eintraege an die einheitlichen Saved-Card-Controls angepasst.
- Syntaxcheck erfolgreich.


## Version 1.2.12 - Regenwasser Interaktion Hotfix

- Auswahl gespeicherter Regenwasser-Berechnungen stabilisiert.
- Regenflaechen markieren jetzt ohne automatisches Aufklappen.
- Klappcards oeffnen nur noch ueber den Pfeil-Button.
- Markierung wird durch Tippen ausserhalb relevanter Bedienelemente aufgehoben.
- Scrollposition beim Markieren, Bearbeiten und Laden von Regenflaechen stabilisiert.

# TechCalc Pro Release Notes

## 1.2.11 - Abschlusskorrekturen Entwaesserung/Trinkwasser
- Schmutzwasser: Entwaesserungsgegenstaende gespeicherter Berechnungen nachtraeglich bearbeitbar.
- Schmutzwasser: Leitungsarten Vollfuellung und Lueftung aus der Auswahl entfernt.
- Schmutzwasser: Scrollposition bleibt bei Aenderungen erhalten.
- Regenwasser: Grundstuecksflaechen ohne Fallleitungslogik; Hoftopfanzahl priorisiert.
- Trinkwasser: Verbraucher in Nutzungseinheiten und freien Gruppen nachtraeglich bearbeitbar.
- UI: Header-Rand bleibt entfernt und mobile Ergebnisdarstellung stabilisiert.

# Release Notes

## 1.2.10 - Header und Schmutzwasser UI Hotfix
- Sichtbaren Header-Rahmen entfernt; Milchglas-Optik bleibt erhalten.
- E-Mail-Fallback im Feedback-Dialog entfernt, damit keine private Zieladresse sichtbar wird.
- Schmutzwasser-Dimensionierungszeilen fuer mobile Ansichten stabilisiert.
- Leitungsart-Auswahl im Schmutzwasser bleibt nach Auswahl rechts liegender Tabs sichtbar und aktiv.

## 1.2.9 - Header Safe-Area Statusbar Hotfix
- Safe-Area oberhalb des Headers auf dieselbe Milchglas-Optik wie der Header gesetzt.
- Theme-Color und Manifest-Farben fuer GitHub/Netlify vereinheitlicht.
- Header selbst auf urspruengliche Milchglas-Optik belassen.

## 1.2.8 - Header Safe-Area Hotfix
- Header wieder auf urspruengliche Milchglas-Optik zurueckgesetzt.
- Safe-Area/Statusbar-Bereich oberhalb des Headers erhaelt die gleiche Glasflaeche statt schwarzem Hintergrund.
- Theme-Color fuer Netlify/GitHub-Hosting vereinheitlicht.
- Cache-Version erhoeht.


## 1.2.7 - Regenwasser Ergebnisstruktur und Header-Fix
- Header auf transparente Darstellung ohne schwarzen Fallback vereinheitlicht.
- Regenwasser: Sammelleitungsdimensionierung aus der Ausgabe entfernt.
- Regenwasser: Gefaelle- und Fuellgrad-Inputs entfernt.
- Ergebnis- und Klappcards nach Hauptentwaesserung und Notentwaesserung sortiert.
- Syntaxcheck durchgefuehrt.

## 1.2.6 - Regenwasser Notentwaesserung UX und Flaechenbearbeitung
- Notentwaesserung wird bei Dachflaechen ohne zusaetzlichen Aktivierungs-Switch berechnet.
- Eingaben fuer rechteckige/runde Notueberlaeufe werden kontextabhaengig angezeigt.
- Hersteller-DN und Hersteller-Abflusswert fuer Notueberlaeufe ergaenzt.
- Regenflaechen sind auswaehlbar und nachtraeglich editierbar; Aenderungen werden auf die aktive Flaeche uebernommen.
- Ergebnis-Card zeigt nur die markierte bzw. zuletzt berechnete Flaeche.
- Ueberlaufbreite wird je Notueberlauf ausgegeben.
- Normhinweise-Format mit Leerzeichen nach Doppelpunkt gesichert.

## 1.2.5 - Regenwasser Notentwaesserung und Header-Fix
- Header-Hintergrund fuer GitHub Pages / Netlify vereinheitlicht und schwarzen Balken entfernt.
- Regenwasser Phase 2: Notentwaesserung als Vorbemessung ergaenzt.
- r(5,100), Notabfluss Qnot, Notueberlaufanzahl und erforderliche Ueberlaufbreite in den Flaechen-Klappcards ergaenzt.
- Ueberflutungsnachweis bleibt bewusst fuer ein separates spaeteres Modul ausgeklammert.

## 1.2.4 - Regenwasser Flaechenauswahl und UX-Korrektur

- Ergebnis-Card zeigt nur noch die markierte bzw. zuletzt berechnete Dach-/Grundstuecksflaeche.
- Flaechen sind markierbar; Klappcards enthalten alle relevanten Dimensionierungswerte inklusive Ablaufdimension.
- Separater Speichern-Dialog im Regenwasser-Modul entfernt.
- r(5,5) und r(5,2) werden als getrennte Eingabewerte gehalten.
- Ablauf-/Hoftopf-DN, Abflusswert und Anstauhoehe manuell ueberschreibbar.
- Separate Dimensionierungs-/Berechnungsansatz-Card entfernt; Angaben in Flaechen-Klappcards verlagert.
- Normhinweise mit sauberer Doppelpunkt-/Leerzeichen-Darstellung.

## 1.2.3 - Regenwasser Lade-Hotfix
- Regenwasser: Laufzeitfehler beim Initialisieren des Moduls behoben.
- Fehlende Rueckgabewerte fuer Ablaufdimension und Anstauhoehe sauber aus dem ausgewaehlten Dacheinlauf/Hoftopf abgeleitet.
- Kompatibilitaet verbessert: interne Array-Endzugriffe ohne `.at()` umgesetzt.
- Version und Cache auf 1.2.3 erhoeht.

## 1.2.1 - Regenwasser UX und Berechnungsworkflow
- Regenwasser-Eingabe auf Dachflaeche/Grundstuecksflaeche reduziert.
- Leitungsart-Auswahl entfernt; Dimensionierung ueber Sammelleitung, Fallleitung und Anzahl Dacheinlaeufe/Hoftoepfe.
- KOSTRA-Verlinkung auf OpenKo geaendert.
- Regenspende dynamisch als r(5,5) fuer Dachflaechen bzw. r(5,2) fuer Grundstuecksflaechen gefuehrt.
- Flaechen werden einzeln berechnet und in der Ausgabe separat ausgewiesen.
- Speicherbereich bleibt am Ende des Eingabeworkflows.
- Version und Cache auf 1.2.1 erhoeht.

## 1.2.0 - Neues Modul Regenwasser
- Neues Modul "Regenwasser" als eigenstaendiger Sanitaer-Rechner nach DIN 1986-100 vorbereitet.
- Dachflaechen-/Grundstuecksflaechen-Erfassung mit Abflussbeiwerten Cs/Cm nach Flaechenart integriert.
- Manuelle KOSTRA-Regenspendeingabe mit offiziellem DWD-Link ergaenzt.
- Qr-Berechnung, DN-Vorbemessung ueber Tabellen A.3 bis A.5, Dachablauf-Anzahl, Notentwaesserungs-Basis und Rinnen-Basis integriert.
- Druckstroemungsentwaesserung bewusst nicht beruecksichtigt.
- Speicher-/Auswahl-/Aktualisieren-Logik gemaess globaler Saved-Card-Systematik umgesetzt.
- Version und Cache auf 1.2.0 erhoeht.

## 1.1.4 - Schmutzwasser UX-Nachschaerfung
- Leitungsart-Card auf reine Auswahl und Eingaben reduziert.
- Leitungsartspezifische Hinweise in die Normhinweise/Plausibilitaet verschoben.
- Hinweise fuer Einzelanschluss/Anschlussleitung mit konkreten Leitungslaengen und Umlenkungen ergaenzt.
- Entwaesserungsgegenstaende auf kompakte Trinkwasser-aehnliche Auswahl-/Listen-UX umgestellt.
- Version und Cache auf 1.1.4 erhoeht.

## 1.1.3 - Schmutzwasser UX-Hinweise und Projekt-Speichern

- Schmutzwasser: Reihenfolge der Eingabecards angepasst: zuerst Leitungsart, danach Entwaesserungsgegenstaende.
- Schmutzwasser: Normhinweise mit sauberer Label-Darstellung "Normgrundlage:" und "Hinweis:" formatiert.
- Schmutzwasser: leitungsartspezifische Hinweise ergaenzt, z. B. maximale Leitungslaengen und Umlenkungen bei Anschlussleitungen.
- Projekt speichern: nutzt unterstuetzte Browser-Dateiauswahl ueber File System Access API; Fallback bleibt Download.
- Version und Cache auf 1.1.3 erhoeht.

## 1.1.2 - Schmutzwasser UX-Vereinfachung
- Ergebnisprioritaet auf empfohlene DN umgestellt und Ergebnis/Dimensionierung/Berechnungsansatz zusammengefuehrt.
- Gefaelle-Eingabe auf deutsche Dezimaldarstellung mit 1,0 cm/m als Standard korrigiert.
- Leitungsart und Entwaesserungsgegenstaende kompakter dargestellt; Laenge und Umlenkungen nur noch als Normhinweis.
- Fuer WC-Anlagen bei Sammel-/Grundleitungen anwenderseitig mindestens DN 100 angesetzt.
- Fester DIN-1986-100-Hinweis in die Normhinweise aufgenommen.
- Version und Cache auf 1.1.2 erhoeht.

## 1.1.1 - Schmutzwasser UX und Fallleitungslogik
- Entwaesserungsgegenstaende als Klappcards umgesetzt.
- Leitungsart-Auswahl fuer Einzel-/Sammelanschluss mit Vorwahl belueftet/unbelueftet vereinfacht.
- Fallleitungen mit angeschlossenem WC setzen nun mindestens DN 100 an.
- Version und Cache auf 1.1.1 erhoeht.

## 1.1.0 - Neues Modul Schmutzwasser

- Neues Modul "Schmutzwasser" als eigenstaendiger Sanitaer-Rechner nach DIN 1986-100 angelegt.
- DU-Katalog, Nutzung/K-Abflusskennzahl, Qww-/Qtot-Berechnung und Zusatzabfluesse integriert.
- Leitungstypen fuer Einzelanschluss-, Sammelanschluss-, Fall-, Sammel-, Grund- und Lueftungsleitungen vorbereitet.
- Tabellenlogik fuer Sammelanschlussleitungen, Fallleitungen und hydraulische Vorbemessung ueber Tabellen A.3 bis A.5 integriert.
- Speicher-/Auswahl-/Aktualisieren-Logik gemaess globaler Saved-Card-Systematik umgesetzt.
- Version und Cache auf 1.1.0 erhoeht.

## 1.0.13 - Debug Hotfix

- Heizung: Laden gespeicherter Leitungsabschnitte uebernimmt Eingabewerte nun robust aus normalisierten und aelteren gespeicherten Datensaetzen.
- Lueftung: Laden gespeicherter Leitungsabschnitte befuellt die Eingaben wieder zuverlaessig, inklusive Betriebsart und Temperaturen.
- WRG: Beim Laden gespeicherter RLT-Geraete wird die gespeicherte Berechnungsart WRG/Mischluft wieder auf den Switch uebertragen.
- Trinkwasser: Gespeicherte Einzelverbraucher werden bei Auswahl auch aus aelteren Datenstrukturen in den aktiven Entwurf und die Zusammenstellung uebernommen.

## 1.0.12 - Debug Hotfix
- Heizung: Laden gespeicherter Abschnitte robust gegen aeltere Record-Strukturen gemacht.
- Lueftung: Auswahl gespeicherter Objekte stabilisiert und Fallback fuer aeltere Datensaetze ergaenzt.
- WRG: Auswahl gespeicherter RLT-Geraete stabilisiert und Event-Zuordnung gehaertet.
- h,x: Aktiven Prozess durch Klick ausserhalb der Prozess-/Eingabebereiche abwaehlbar gemacht.
- Druck: Desktop-Overflow der Beschriftung "Auswahl Station / Gefaess" in Ergebnis-Kacheln korrigiert.
- Trinkwasser: Auswahl gespeicherter Einzelverbraucher mit robuster ID-Zuordnung und direkter Uebernahme in die Zusammenstellung abgesichert.

## 1.0.11 - Debug Hotfix

- Heizung: Auswahl gespeicherter Leitungsabschnitte laedt die gespeicherten Eingaben robuster und erlaubt erneutes Abwaehlen.
- Lueftung: Auswahl gespeicherter Leitungsabschnitte stabilisiert; erneutes Tippen auf aktive Card hebt die Auswahl auf.
- WRG: Auswahl gespeicherter RLT-Geraete stabilisiert; aktive Card kann erneut abgewaehlt werden.
- h,x: aktive Prozesse koennen durch erneutes Antippen abgewaehlt werden, damit wieder neue Prozesse angelegt werden koennen.
- Druckhaltung: Ergebnisbeschriftung "Station / Gefaess" gekuerzt und Overflow-Schutz ergaenzt.
- Puffer: Beim Abwaehlen einer gespeicherten Card werden die Eingabefelder geleert.
- Trinkwasser: Einzelverbraucher-Auswahl laedt sauber in Bearbeitung und Zusammenstellung; Auswahl-Handler bricht danach korrekt ab.
- Navigation: Modulauswahlleiste bleibt auf Desktop/Tablet fix unterhalb des Headers, Content laeuft dahinter durch.
