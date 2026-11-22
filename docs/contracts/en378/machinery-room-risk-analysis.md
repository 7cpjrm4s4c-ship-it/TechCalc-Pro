# Spezifikation: Risikoanalyse Maschinenraum (EN 378-3, 4.3)

Status: verbindlich, umgesetzt in PR #34.
Bezug: DIN EN 378-3:2020-12, Abschnitt 4.3; Auszüge unter docs/norms/en-378/.

## 1. Grundsatz

Die Risikoanalyse wird nicht durch TechCalc Pro durchgeführt. Die Anwendung
dokumentiert ausschließlich die Entscheidung des verantwortlichen Planers auf
Grundlage des Sicherheitskonzeptes, der Herstellerangaben, der Füllmenge und der
Sicherheitsklassifikation des Kältemittels (EN 378-3:2020-12, 4.3).

## 2. Datenmodell

| Feld | Typ | Bedeutung |
| — | — | — |
| machineryRoomRiskAnalysisStatus | enum (absent, present) | Risikoanalyse vorhanden oder nicht |
| machineryRoomRiskAnalysisResult | nullable boolean | true: Maschinenraum erforderlich; false: nicht erforderlich; null: offen |
| machineryRoomRiskAnalysisNotes | string, optional | Bemerkungen zur Grundlage der Entscheidung |

null im Ergebnisfeld stellt den offenen, noch nicht bestätigten Zustand dar. Ein
separates Feld für den Prüfstatus ist nicht erforderlich; er wird abgeleitet.
installationLocation bleibt das alleinige maßgebliche Feld für die
Aufstellortklassifikation; hasMachineryRoom wird entfernt (siehe Abschnitt 6).

## 3. Ergebnisverhalten

| Zustand der Risikoanalyse | Verhalten |
| — | — |
| Keine Risikoanalyse vorhanden (absent) | Bewertung bleibt offen; Hinweistext A |
| Vorhanden, Ergebnis null (offen) | Bewertung bleibt offen |
| Ergebnis true (Maschinenraum erforderlich) | Prüfpfad 5.1 bis 5.14 wird aktiviert |
| Ergebnis false (kein Maschinenraum erforderlich) | 4.3 wird beendet; Hinweistext B; Planer wählt 4.4, 4.5 oder 4.6; keine automatische Zuordnung; das Ergebnis wird nicht als unzulässig bewertet |

Hinweistext A: Fuer die Bewertung des Aufstellortes 4.3 liegt keine Risikoanalyse
vor. Eine normative Bewertung als Maschinenraum kann daher nicht abgeschlossen
werden. Bitte vervollstaendige die Risikoanalyse oder waehle einen alternativen
Aufstellort gemaess DIN EN 378-3.

Hinweistext B: Die Risikoanalyse ergibt, dass kein separater Maschinenraum
erforderlich ist. Bitte waehle einen alternativen Aufstellort gemaess DIN EN 378-3,
Abschnitt 4.4, 4.5 oder 4.6.

Planerhinweis (EN 378-3, 4.3, Anmerkung 3): Ein begehbares Gehaeuse, das gross
genug ist, um von Personen betreten zu werden, ist als Maschinenraum zu bewerten.

## 4. Abhaengigkeitsmatrix (verbindlich)

Normative Grundlage: EN 378-3:2020-12, 4.3 nennt als Eingangsgruende der
Risikoanalyse das Sicherheitskonzept, die Herstellerangaben, die Fuellmenge und die
Sicherheitsklassifikation des Kaeltemittels. EN 378-1:2021-06, Anhang C, bestimmt
die maximal zulaessige Fuellmenge aus Toxizitaets-/Brennbarkeitsklasse,
Zugangsbereichskategorie (Tabelle 4) und Aufstellungsortklasse (5.3).

| Ausloeser | Bedingung | Erneute Bestaetigung | Normbezug |
| — | — | — | — |
| Kaeltemittelwechsel | jeder Wechsel, auch innerhalb derselben Sicherheitsklasse | ja | EN 378-3, 4.3 (Sicherheitsklassifikation); EN 378-1, Anhang C, 5.2 |
| Sicherheitsklasse | jede Aenderung (A1, B1, A2L, A2, A3, B2L, B2, B3) | ja | EN 378-3, 4.3; 5.14 |
| Gesamtfuellmenge | jede Wertanderung | ja | EN 378-3, 4.3 (unter Beachtung der Fuellmenge); zusaetzlicher Pflichtzustand bei unter Erdgleiche, Klasse 3, groesser m2 |
| Aufstellung unter Erdgleiche | Eintritt oder Austritt des Zustands | ja | EN 378-3, 4.3 (zusaetzlicher Gasdetektor und Alarm) |
| Anlagenkonfiguration | Aenderung, die die im Maschinenraum befindlichen Komponenten oder Kreise betrifft | ja | EN 378-3, 5.13.4 (m: groesste Fuellmenge mit irgendeinem Teil im Maschinenraum) |
| Anlagenkonfiguration | Aenderung ohne Bezug zum Maschinenraum | nein | keine Wirkung auf die Eingangsgroessen |
| Zugangsbereichskategorie (a, b, c) | jede Aenderung | ja | EN 378-1, 5.1 Tabelle 4, Anhang C Tabellen C.1/C.2 |
| Herstellerangaben / Sicherheitskonzept | Aenderung der dokumentierten Grundlage | ja, sofern Eingabefelder existieren; sonst keine Ruecksetzung | EN 378-3, 4.3 |
| Bemerkungsfeld | reine Textaenderung | nein | Dokumentation, keine Eingangsgroesse |

Begruendung zur Fuellmenge: Da die Anwendung nur die Entscheidung dokumentiert und
die internen Schwellenwerte der durchgefuehrten Analyse nicht kennt, darf keine
Wertaenderung als unwirksam angenommen werden. Threshold-basierte Ruecksetzungen
(nur bei Ueberschreiten von m2) sind unzulaessig.

Kaeltemittelwechsel impliziert Sicherheitsklassenwechsel: die Ruecksetzung erfolgt
einmal, nicht doppelt.

## 5. Zustandsuebergaenge

### 5.1 Aenderungen an der Risikoanalyse

| Aenderung | Reaktion |
| — | — |
| Status nicht vorhanden zu vorhanden | Ergebnis muss neu eingegeben werden |
| Status vorhanden zu nicht vorhanden | Ergebnis zuruecksetzen, Bemerkungen loeschen |
| Ergebnis offen zu Maschinenraum erforderlich | Pruefpfad 5.1 bis 5.14 initialisieren |
| Ergebnis offen zu nicht erforderlich | 5.1 bis 5.14 deaktivieren |
| Erforderlich zu nicht erforderlich | alle Unterpruefungen 5.1 bis 5.14 zuruecksetzen |
| Nicht erforderlich zu erforderlich | Pruefpfad 5.1 bis 5.14 neu initialisieren |
| Ergebnis unveraendert | keine Ruecksetzung |

Bemerkungen: Bei Aenderung des Analyseergebnisses bleiben sie erhalten. Bei
Kennzeichnung der Risikoanalyse als nicht vorhanden werden sie geloescht (keine
separate Historienfunktion vorhanden).

### 5.2 Ausloeser nach Abschnitt 4 (Kaeltemittel, Fuellmenge, Erdgleiche, Konfiguration, Zugangsbereich)

Einheitliche Reaktion: Analysestatus bleibt vorhanden; Ergebnis wird auf null
(offen) zurueckgesetzt; Bemerkungen bleiben erhalten; Bewertung wird offen gesetzt;
vorhandene Ergebnisse aus 5.1 bis 5.14 werden deaktiviert und zurueckgesetzt.

### 5.3 Aenderung des Aufstellortes

Wird installationLocation von machinery-room auf einen anderen Aufstellort
gaendert, wird der 4.3-Pruefpfad vollstaendig verlassen. Zurueckgesetzt werden:
Analysestatus, Analyseergebnis, Bemerkungen, saemtliche Eingaben aus 5.1 bis 5.14,
alle daraus abgeleiteten Ergebnisse und Planerhinweise, 4.3-spezifische
Statusinformationen. Allgemeine Anlagendaten bleiben erhalten. Erneute Auswahl von
machinery-room beginnt mit leerem Pruefzustand.

### 5.4 Aenderungen innerhalb von 5.1 bis 5.14

Keine pauschale Ruecksetzung: nur tatsaechlich abhaengige Ergebnisse werden
zurueckgesetzt; nicht betroffene Pruefpunkte bleiben erhalten. Bei Aenderung der
Risikoanalyse auf nicht erforderlich werden saemtliche Unterpruefungen
zurueckgesetzt. Die konkreten Abhaengigkeiten werden je Normabschnitt bei der
fachlichen Ausarbeitung festgelegt.

## 6. Bereinigung der Doppelstruktur

installationLocation (mit der Option machinery-room) ist das alleinig massgebliche
Feld. hasMachineryRoom wird entfernt, sofern die vollstaendige
Verwendungsprüfung keine eigenstaendige Funktion nachweist. Vor der Entfernung sind
alle Verwendungen zu pruefen: Bewertungs- und Berechnungsfunktionen,
Ergebnisaufbereitung, Planerleitfaden, PDF-Export, gespeicherte Pruefungen, Import
und Export, Normalisierung, Tests und Test-Fixtures. Gespeicherte Pruefungen erhalten
eine eindeutige Migration; widerspruechliche Angaben duerfen nicht ungeprueft
uebernommen werden. Bestehende gespeicherte Pruefungen mit
installationLocation gleich machinery-room werden auf die abgeleitete Semantik
migriert.

## 7. Bedingter Pflichtzustand innerhalb 4.3

Bei Anlagen unter Erdgleiche mit brennbaren Kaeltemitteln der Klasse 3 und einer
Fuellmenge von mehr als m2 ist ein zusaetzlicher Gasdetektor und ein
akustischer/visueller Alarm einzusetzen (EN 378-3:2020-12, 4.3). Dies ist ein
bedingter Folgezustand des Pruefpfads, kein Ausloeser der Risikoanalyse selbst.
m2 wird berechnet als 26 m3 mal LFL (EN 378-1:2021-06, Anhang C).

## 8. Offene Punkte

1. Klärung im Bestandsschema: Zugangsbereichskategorie und Erdgleiche-Status sind
   als Felder vorhanden oder in 4.3 zu ergänzen (erforderlich wegen Anhang C).
2. Verifikation dieser Matrix gegen EN 378-2 nach Vorliegen des Dokuments
   (insbesondere 6.2.14 fuer die Klassen 2L, 2 und 3).
3. Vollstaendige Verwendungspruefung von hasMachineryRoom vor der Entfernung.

## 9. Arbeitsgrundsätze

Zunaechst fachliche und normative Logik vollstaendig klären. Keine Codeaenderungen
ohne ausdrueckliche Freigabe. 4.2 bleibt unveraendert. 4.3 ist ein eigenstaendiger
Pruefpfad. Keine redundanten Datenfelder. Keine pauschalen Ruecksetzungen. Jede
Aenderung mit Regressionstests absichern.
