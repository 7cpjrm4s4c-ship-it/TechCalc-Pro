## 1.2.18 Refactor Phase 3

- Trinkwasser-Modul intern bereinigt: doppelte Klick-/Change-Aktionslogik entfernt.
- Gemeinsame Helfer für NE- und Einzelverbraucher-Aktionen ergänzt.
- Eingabe-, Speicher-, Aktualisieren-, Löschen- und Bearbeiten-Workflow im Trinkwasser-Modul vereinheitlicht.
- GL-/zentrale-WWB-Berechnung per Smoke-Test geprüft.
- Versionierung bleibt für den Release bei 1.2.18.


## 1.2.18 Refactor UX Pass 2
- Erweiterung der zentralen Form-Action-Helper.
- Vorbereitung fuer Event-Delegation in allen Modulen.
- Basis fuer vereinheitlichte Mengen-/Anzahlfelder geschaffen.

## Version 1.2.18 - Refactor / UX-Konsolidierung

- Schmutzwasser: gespeicherte Berechnungen auf zentrale Saved-Record-Komponente umgestellt.
- Schmutzwasser: Eingabewerte werden vor Aktionsklicks zentral committed; Doppel-Klick-Workflows werden vermieden.
- Core: `formActions` als wiederverwendbarer Helper für Action-Buttons mit aktiven Eingaben ergänzt.
- Core: Saved-Card-Toggles schließen andere geöffnete Cards standardisiert.
- Core: Record-IDs, Replace/Delete und Saved-Card-Binding werden konsequenter über zentrale Helfer genutzt.
- Versionierung für Release-Linie auf 1.2.18 gesetzt.

## Version 1.2.17 - Hosting / Darstellung Hotfix

- Release Notes werden im Menü dynamisch mit Versionsparameter und `cache: no-store` geladen.
- Service Worker behandelt `RELEASE_NOTES.md`, `index.html` und Navigationsanfragen netzwerkpriorisiert, damit gehostete Updates sichtbar werden.
- Netlify-Header für `index.html`, `service-worker.js` und `RELEASE_NOTES.md` ergänzt.
- Darstellungseinstellungen im Menü werden dauerhaft über `localStorage` gespeichert und nach dem Schließen der App wiederhergestellt.

## Version 1.2.16 - Release Notes / Link-State Hotfix

- Release Notes im Menü auf den aktuellen Stand gebracht.
- Regenwasser-Status wird vor dem Öffnen externer KOSTRA/OpenKo-Links gesichert.
- Mobile Schnellzugriffe werden dauerhaft gespeichert.
- Eingestellte Werte, markierte Flächen und Flächenliste bleiben nach Rückkehr aus externen Links erhalten.

## Version 1.2.15 - Regenwasser Flächen-UX Hotfix

- Gespeicherte Regenwasser-Berechnungen Card entfernt.
- Markierungsrahmen wird nur noch bei aktiv ausgewählter Fläche angezeigt.
- Flächenarten nach Dachflächen und Hofflächen getrennt.
- Scroll-Sprünge bei Auswahl/Bearbeitung von Regenflächen weiter stabilisiert.

## Version 1.2.14 - Regenwasser/Trinkwasser Interaktion Hotfix

- Regenwasser: Scroll-Sprünge bei Flächenauswahl reduziert.
- Regenwasser: erneutes Antippen einer markierten Fläche hebt die Markierung auf.
- Regenwasser: Flächenliste aus der Eingabe-Card entfernt, um doppelte Darstellung zu vermeiden.
- Regenwasser: Aktualisieren-Button für nachträgliche Flächenkorrekturen ergänzt.
- Regenwasser: Flächenänderungen werden erst nach aktiver Quittierung übernommen.
- Trinkwasser: Auswahl freier Verbraucher von aktiven Nutzungseinheiten entkoppelt.

## Version 1.2.13 - Trinkwasser/Regenwasser Interaktion Hotfix
- Trinkwasser: gespeicherte Nutzungseinheiten und freie Einrichtungsgegenstände wieder per Klick auswählbar.
- Regenwasser: gespeicherte Einträge bleiben beim Antippen geschlossen und öffnen nur über den Pfeil.
- Regenwasser: Pfeil-Optik der gespeicherten Einträge an die einheitlichen Saved-Card-Controls angepasst.
- Syntaxcheck erfolgreich.


## Version 1.2.12 - Regenwasser Interaktion Hotfix

- Auswahl gespeicherter Regenwasser-Berechnungen stabilisiert.
- Regenflächen markieren jetzt ohne automatisches Aufklappen.
- Klappcards öffnen nur noch über den Pfeil-Button.
- Markierung wird durch Tippen außerhalb relevanter Bedienelemente aufgehoben.
- Scrollposition beim Markieren, Bearbeiten und Laden von Regenflächen stabilisiert.

# TechCalc Pro Release Notes

## 1.2.11 - Abschlusskorrekturen Entwässerung/Trinkwasser
- Schmutzwasser: Entwässerungsgegenstände gespeicherter Berechnungen nachträglich bearbeitbar.
- Schmutzwasser: Leitungsarten Vollfüllung und Lüftung aus der Auswahl entfernt.
- Schmutzwasser: Scrollposition bleibt bei Änderungen erhalten.
- Regenwasser: Grundstücksflächen ohne Fallleitungslogik; Hoftopfanzahl priorisiert.
- Trinkwasser: Verbraucher in Nutzungseinheiten und freien Gruppen nachträglich bearbeitbar.
- UI: Header-Rand bleibt entfernt und mobile Ergebnisdarstellung stabilisiert.

# Release Notes

## 1.2.10 - Header und Schmutzwasser UI Hotfix
- Sichtbaren Header-Rahmen entfernt; Milchglas-Optik bleibt erhalten.
- E-Mail-Fallback im Feedback-Dialog entfernt, damit keine private Zieladresse sichtbar wird.
- Schmutzwasser-Dimensionierungszeilen für mobile Ansichten stabilisiert.
- Leitungsart-Auswahl im Schmutzwasser bleibt nach Auswahl rechts liegender Tabs sichtbar und aktiv.

## 1.2.9 - Header Safe-Area Statusbar Hotfix
- Safe-Area oberhalb des Headers auf dieselbe Milchglas-Optik wie der Header gesetzt.
- Theme-Color und Manifest-Farben für GitHub/Netlify vereinheitlicht.
- Header selbst auf ursprüngliche Milchglas-Optik belassen.

## 1.2.8 - Header Safe-Area Hotfix
- Header wieder auf ursprüngliche Milchglas-Optik zurückgesetzt.
- Safe-Area/Statusbar-Bereich oberhalb des Headers erhält die gleiche Glasfläche statt schwarzem Hintergrund.
- Theme-Color für Netlify/GitHub-Hosting vereinheitlicht.
- Cache-Version erhöht.


## 1.2.7 - Regenwasser Ergebnisstruktur und Header-Fix
- Header auf transparente Darstellung ohne schwarzen Fallback vereinheitlicht.
- Regenwasser: Sammelleitungsdimensionierung aus der Ausgabe entfernt.
- Regenwasser: Gefälle- und Füllgrad-Inputs entfernt.
- Ergebnis- und Klappcards nach Hauptentwässerung und Notentwässerung sortiert.
- Syntaxcheck durchgeführt.

## 1.2.6 - Regenwasser Notentwässerung UX und Flächenbearbeitung
- Notentwässerung wird bei Dachflächen ohne zusätzlichen Aktivierungs-Switch berechnet.
- Eingaben für rechteckige/runde Notüberläufe werden kontextabhängig angezeigt.
- Hersteller-DN und Hersteller-Abflusswert für Notüberläufe ergänzt.
- Regenflächen sind auswählbar und nachträglich editierbar; Änderungen werden auf die aktive Fläche übernommen.
- Ergebnis-Card zeigt nur die markierte bzw. zuletzt berechnete Fläche.
- Überlaufbreite wird je Notüberlauf ausgegeben.
- Normhinweise-Format mit Leerzeichen nach Doppelpunkt gesichert.

## 1.2.5 - Regenwasser Notentwässerung und Header-Fix
- Header-Hintergrund für GitHub Pages / Netlify vereinheitlicht und schwarzen Balken entfernt.
- Regenwasser Phase 2: Notentwässerung als Vorbemessung ergänzt.
- r(5,100), Notabfluss Qnot, Notüberlaufanzahl und erforderliche Überlaufbreite in den Flächen-Klappcards ergänzt.
- Überflutungsnachweis bleibt bewusst für ein separates späteres Modul ausgeklammert.

## 1.2.4 - Regenwasser Flächenauswahl und UX-Korrektur

- Ergebnis-Card zeigt nur noch die markierte bzw. zuletzt berechnete Dach-/Grundstücksfläche.
- Flächen sind markierbar; Klappcards enthalten alle relevanten Dimensionierungswerte inklusive Ablaufdimension.
- Separater Speichern-Dialog im Regenwasser-Modul entfernt.
- r(5,5) und r(5,2) werden als getrennte Eingabewerte gehalten.
- Ablauf-/Hoftopf-DN, Abflusswert und Anstauhöhe manuell überschreibbar.
- Separate Dimensionierungs-/Berechnungsansatz-Card entfernt; Angaben in Flächen-Klappcards verlagert.
- Normhinweise mit sauberer Doppelpunkt-/Leerzeichen-Darstellung.

## 1.2.3 - Regenwasser Lade-Hotfix
- Regenwasser: Laufzeitfehler beim Initialisieren des Moduls behoben.
- Fehlende Rückgabewerte für Ablaufdimension und Anstauhöhe sauber aus dem ausgewählten Dacheinlauf/Hoftopf abgeleitet.
- Kompatibilität verbessert: interne Array-Endzugriffe ohne `.at()` umgesetzt.
- Version und Cache auf 1.2.3 erhöht.

## 1.2.1 - Regenwasser UX und Berechnungsworkflow
- Regenwasser-Eingabe auf Dachfläche/Grundstücksfläche reduziert.
- Leitungsart-Auswahl entfernt; Dimensionierung über Sammelleitung, Fallleitung und Anzahl Dacheinläufe/Hoftöpfe.
- KOSTRA-Verlinkung auf OpenKo geändert.
- Regenspende dynamisch als r(5,5) für Dachflächen bzw. r(5,2) für Grundstücksflächen geführt.
- Flächen werden einzeln berechnet und in der Ausgabe separat ausgewiesen.
- Speicherbereich bleibt am Ende des Eingabeworkflows.
- Version und Cache auf 1.2.1 erhöht.

## 1.2.0 - Neues Modul Regenwasser
- Neues Modul „Regenwasser“ als eigenständiger Sanitär-Rechner nach DIN 1986-100 vorbereitet.
- Dachflächen-/Grundstücksflächen-Erfassung mit Abflussbeiwerten Cs/Cm nach Flächenart integriert.
- Manuelle KOSTRA-Regenspendeingabe mit offiziellem DWD-Link ergänzt.
- Qr-Berechnung, DN-Vorbemessung über Tabellen A.3 bis A.5, Dachablauf-Anzahl, Notentwässerungs-Basis und Rinnen-Basis integriert.
- Druckströmungsentwässerung bewusst nicht berücksichtigt.
- Speicher-/Auswahl-/Aktualisieren-Logik gemäß globaler Saved-Card-Systematik umgesetzt.
- Version und Cache auf 1.2.0 erhöht.

## 1.1.4 - Schmutzwasser UX-Nachschärfung
- Leitungsart-Card auf reine Auswahl und Eingaben reduziert.
- Leitungsartspezifische Hinweise in die Normhinweise/Plausibilität verschoben.
- Hinweise für Einzelanschluss/Anschlussleitung mit konkreten Leitungslängen und Umlenkungen ergänzt.
- Entwässerungsgegenstände auf kompakte Trinkwasser-ähnliche Auswahl-/Listen-UX umgestellt.
- Version und Cache auf 1.1.4 erhöht.

## 1.1.3 - Schmutzwasser UX-Hinweise und Projekt-Speichern

- Schmutzwasser: Reihenfolge der Eingabecards angepasst: zuerst Leitungsart, danach Entwässerungsgegenstände.
- Schmutzwasser: Normhinweise mit sauberer Label-Darstellung „Normgrundlage:“ und „Hinweis:“ formatiert.
- Schmutzwasser: leitungsartspezifische Hinweise ergänzt, z. B. maximale Leitungslängen und Umlenkungen bei Anschlussleitungen.
- Projekt speichern: nutzt unterstützte Browser-Dateiauswahl über File System Access API; Fallback bleibt Download.
- Version und Cache auf 1.1.3 erhöht.

## 1.1.2 - Schmutzwasser UX-Vereinfachung
- Ergebnispriorität auf empfohlene DN umgestellt und Ergebnis/Dimensionierung/Berechnungsansatz zusammengeführt.
- Gefälle-Eingabe auf deutsche Dezimaldarstellung mit 1,0 cm/m als Standard korrigiert.
- Leitungsart und Entwässerungsgegenstände kompakter dargestellt; Länge und Umlenkungen nur noch als Normhinweis.
- Für WC-Anlagen bei Sammel-/Grundleitungen anwenderseitig mindestens DN 100 angesetzt.
- Fester DIN-1986-100-Hinweis in die Normhinweise aufgenommen.
- Version und Cache auf 1.1.2 erhöht.

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
