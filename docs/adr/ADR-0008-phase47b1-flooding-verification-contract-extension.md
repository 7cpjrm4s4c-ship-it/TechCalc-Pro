# ADR-0008: Erweiterung des Überflutungsnachweises um Leitungs-, Rückhalte- und Flächenimport-Architektur

Status: Angenommen  
Datum: 2026-07-13  
Phase: 47B.1

## Kontext

Nach Abschluss von Phase 47B wurden zusätzliche fachliche Grundlagen bereitgestellt: Auszüge der DIN 1986-100 einschließlich Gleichungen (20), (21) und Tabelle A.5 sowie das Arbeitsblatt DWA-A 117. Zusätzlich soll der Nutzer Flächendaten aus dem Regenwassermodul übernehmen können, sie im Überflutungsnachweis aber unabhängig bearbeiten.

Der bisherige Contract behandelte `Qvoll` nur als manuellen Eingabewert, schloss DWA-A 117 und eine Datenübernahme aus `rainwater` aus und definierte den Behörden-PDF-Nachweis noch nicht mit der erforderlichen Tiefe.

## Entscheidung

1. Der Modulscope wird um Leitungsprüfung, Leitungsdimensionierung und das einfache Verfahren nach DWA-A 117 erweitert.
2. Tabelle A.5 der DIN 1986-100 wird als zentrale, versionierte Fachdatentabelle modelliert.
3. Abflusswerte erhalten vier fachlich getrennte Quellen: vorhandene Leitung, Leitungsdimensionierung, manueller Vollfüllungsabfluss und behördliche Einleitungsbegrenzung.
4. Das Modul darf Flächen aus `rainwater` ausschließlich durch eine explizite Nutzeraktion als validierten Snapshot importieren.
5. Der Snapshot wird tief kopiert, erhält lokale IDs und bleibt anschließend vollständig unabhängig. Eine Rückschreibung oder Live-Synchronisierung ist untersagt.
6. Wiederholte Importe verwenden Quell-IDs zur Konflikt- und Duplikaterkennung. Lokale Änderungen dürfen nicht stillschweigend überschrieben werden.
7. Die automatische Regendauer folgt nur der in den bereitgestellten DIN-Unterlagen wiedergegebenen Zuordnung. Eine vollständige aktuelle DWA-A-118-Konformität wird nicht behauptet.
8. Der DWA-A-117-Rechenweg wird nur innerhalb seiner Anwendungs- und Funktionsgrenzen als Nachweis ausgegeben. Außerhalb der Grenzen wird eine Langzeitsimulation verlangt.
9. Der Berechnungskern erzeugt ein gemeinsames, unveränderliches Calculation Report Model für UI, PDF und Regression.
10. Der Behörden-PDF-Nachweis wird zu einem verpflichtenden Abnahmekriterium und enthält Eingaben, Quellen, Tabellenfundstellen, vollständige Einsetzrechnungen, Zwischenergebnisse, Gültigkeitsprüfungen und Einschränkungen.

## Begründung

Die Snapshot-Kopplung reduziert doppelte Dateneingabe, ohne Modulgrenzen und bestehende Projekte durch gemeinsam veränderbaren State zu gefährden. Die fachliche Trennung der Abflussquellen verhindert, dass eine behördliche Einleitungsbegrenzung irreführend als Vollfüllungsabfluss ausgewiesen wird. Das Calculation Report Model stellt sicher, dass UI und PDF dieselben Berechnungsdaten verwenden. Die explizite Gültigkeitsprüfung schützt vor einer unzulässigen Anwendung des einfachen DWA-A-117-Verfahrens.

## Konsequenzen

- Vor der UI-Implementierung sind Transfermodell, Adaptervertrag und Konfliktstrategie zu testen.
- Die Fachdatentabelle A.5 benötigt Quellenmetadaten und Referenztests für jede hinterlegte Tabellenzeile.
- Der State wird vor Implementierungsbeginn auf Schema-Version 2 angehoben.
- PDF und Berechnung werden nicht getrennt entwickelt; der Reportvertrag ist Bestandteil der Fachlogik.
- Die Regression muss nachweisen, dass importierte und anschließend geänderte Flächen den State von `rainwater` nicht verändern.
- Langzeitsimulation und vollständige aktuelle DWA-A-118-Berechnung bleiben außerhalb von Version 1.4.0.
