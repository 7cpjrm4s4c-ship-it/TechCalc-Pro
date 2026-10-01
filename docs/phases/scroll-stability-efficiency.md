# Scroll- und Viewport-Optimierung

Basis: main `61cb4999`, Version 2.0.0. Separater Änderungsvorschlag; Observer-Korrektur aus PR #31 nicht enthalten.

## Anlass und Umsetzung

Die Safari-Aufnahme von Preview #31 zeigte Scrollaufrufe in der Modulruntime. Die Quellcodeprüfung bestätigte parallele Rücksetzungen in Router und Runtime sowie Positionsschreibvorgänge ohne vorherigen Vergleich.

Die Runtime nutzt nun die vorhandene Scrollverwaltung für alle Dokument- und Container-Rücksetzungen. Der Router navigiert weiterhin auf demselben Pfad, plant aber keine eigenen Rücksetzungen mehr. Rücksetzungen vor/nach dem Mount bleiben bestehen; die Nachkontrolle im nächsten Frame prüft den Runtime-Token. Bereits passende Positionen lösen keinen Schreibvorgang aus.

Die bestehenden Wiederherstellungspfade verwenden einen gemeinsamen, abbrechbaren Scheduler im vorhandenen Renderer. Neue Wiederherstellungen, Maus-/Touch-/Tastaturbedienung, Mausrad und das Unmount-Ereignis beenden ältere Jobs. Bei asynchronen Aktionen bleiben die Abbruchwächter bis zur Promise-Auflösung bestehen. Abgebrochene Jobs werden beim Abschluss nicht reaktiviert. Ankerbasierte Positionskorrektur und die bisherigen mobilen Nachprüfungszeiten bleiben erhalten.

Der Viewport-Controller bündelt Ereignisse und schreibt CSS-Größen sowie die Bereitschaftsklasse nur bei Änderungen. Beim Wechsel in den Hintergrund werden geplante Frame- und Timer-Prüfungen beendet. Größenänderungen durch Tastatur und Orientierung werden weiter verarbeitet.

## Prüfung

- Neuer Verhaltenstest im Standard-Testlauf: unveränderte Positionen, Ankerkorrektur, Container-Rücksetzungen, neuere Jobs, Bedienabbruch, Unmount-Abbruch, asynchrone Abschlüsse, veraltete Runtime-Frames, Viewport-Ereignisbündelung, Tastaturgröße und Hintergrundwechsel.
- Neue Playwright-Prüfungen: Abbruch im tatsächlichen DOM und schnelle Modulwechsel; vorgesehen für alle vorhandenen Browserprojekte.
- Lokal bestanden: Lint, npm test, Integration, Build, minifizierter Build, Versionsprüfung, Precache-Prüfung und diff --check.
- Lokale Browserprüfung nicht ausgeführt: Playwright-Browserprogramme fehlen; Downloadinstallation scheiterte an einem ungültigen Archiv. CI-Browserprüfung und Sichtprüfung auf iPhone/Safari bleiben offen.
- Der erste Integrationslauf fand das gleichzeitig erzeugte Playwright-Verzeichnis `test-results`. Nach Verschieben der Testergebnisse aus dem Quellbaum bestand der vollständige Integrationslauf.

## Bewertung

Keine Fachberechnung, Persistenz, PDF-Ausgabe oder UI-Gestaltung geändert. Bestehende Core-Komponenten und Verträge bleiben maßgeblich. Die Release Notes und der Render-Vertrag sind aktualisiert. Versionsnummer 2.0.0 bleibt für diesen unveröffentlichten Vorschlag bestehen.

Die testspezifischen Messungen belegen ausbleibende unnötige Schreibvorgänge; sie belegen keine Energieeinsparung auf einem Gerät. Diese ist mit einer neuen Safari-Aufnahme zu prüfen. Vor Merge sind CI und mobile Sichtprüfung erforderlich, insbesondere Modulwechsel, Datensatzauswahl, Fokus/Tastatur und Scrollen unmittelbar nach einer Aktion.

## Nachprüfung: Trinkwasser-Hinzufügen

Die mobile Sichtprüfung meldete ein Hinzufügen bereits beim Aufsetzen des Fingers auf „Verbraucher zur Nutzungseinheit hinzufügen“. Ursache waren die schon in der Basis vorhandenen modulweiten `pointerdown`-/`touchstart`-Handler für beide Draft-Hinzufügen-Buttons. Sie führten die Mutation sofort aus und verhinderten die native Scrollgeste mit `preventDefault()`.

Diese Frühaktivierung wurde entfernt. Die vorhandene Click-Aktion übernimmt nun allein das Hinzufügen und liest weiterhin die sichtbaren Felder vor der Mutation ein. Die bisherige 650-ms-Klicksperre zur Unterdrückung der Doppelaktivierung entfällt ebenfalls. Andere Modulaktionen bleiben unverändert.

Ein neuer Test im Standard-Gate prüft für Nutzungseinheiten und freie Gruppen: kein Hinzufügen/keine Scrollunterdrückung bei Kontakt, Bewegung, Abbruch oder Loslassen; genau ein Hinzufügen je bestätigter Aktivierung; Übernahme der sichtbaren Anzahl; wiederholte beabsichtigte Aktivierungen ohne Zeitsperre. Neue Playwright-Tests prüfen bestätigte native Taps mit vorher fokussiertem Eingabefeld sowie Tastaturaktivierung. Zusätzlich prüft Chromium mit Touchscreen eine native Wischgeste ab dem Button. Die lokale Browserprüfung bleibt wegen fehlender Programme offen; CI und erneute iPhone-Sichtprüfung beziehen sich auf den ergänzten Commit.

Validierung der Trinkwasser-Ergänzung: Lint, Standardtests, Build, minifizierter Build, Versions-/Precache-Prüfung und diff --check bestanden. Die vollständige Integration bestand mit `TZ=Europe/Berlin`. Ein vorheriger Lauf scheiterte an einem unveränderten PDF-Test, der das lokale Datum einer festen UTC-Zeit erwartet; die Ausführungsumgebung stand inzwischen auf Asia/Shanghai. Am PDF-Code und dem Test wurde nichts geändert. Playwright erkennt alle neuen Testfälle; die tatsächliche Browserausführung erfolgt in CI.
