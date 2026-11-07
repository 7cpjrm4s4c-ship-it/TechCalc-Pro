# EN 378 – Überarbeitung der Aufstellort-Prüfpfade

## Ziel

Die normative Bewertungslogik für die Aufstellorte wird auf Basis der schrittweise fachlich geprüften und freigegebenen Normpfade überarbeitet. Die Anforderungen werden nicht als nachträgliche Einzel-Patches in die bestehende Logik eingebaut. Stattdessen werden Auslöser, Abhängigkeiten, Folgeanforderungen und Ergebniszustände je Aufstellort als zusammenhängender Entscheidungsweg modelliert.

## Verbindliche Arbeitsweise

1. Einen Aufstellort-Normpfad vollständig fachlich klären und fixieren.
2. Für diesen Pfad eine Implementierungsspezifikation mit Eingaben, Auslösern, Folgeprüfungen und Ergebniszuständen erstellen.
3. Die bestehende Implementierung und Tests gegen die Spezifikation abgleichen.
4. Die Entscheidungslogik strukturell anpassen; keine bloße Ergänzung isolierter Bedingungen.
5. Regressionstests für positive, negative, bedingte und unvollständige Fälle ergänzen.
6. Erst nach erfolgreicher Prüfung den nächsten Aufstellort bearbeiten.

## Erster Pfad: Aufstellung im Freien – EN 378-3, Abschnitt 4.2

Der fachlich festgelegte Pfad umfasst:

- Prüfung der Definition der Außenaufstellung.
- Prüfung der Grundanforderungen aus Abschnitt 4.2: sichere Anordnung, Schutz vor Eindringen in Gebäudeöffnungen und Belüftung einer vorhandenen Schutzabdeckung.
- Eigenständige örtliche Ja/Nein-Entscheidung, ob sich freigesetztes Kältemittel am Aufstellort ansammeln kann.
- Bei Nein: keine zusätzlichen Anforderungen aus diesem Ansammlungs-Folgepfad.
- Bei Ja: Prüfung der jeweils anwendbaren Anforderungen aus EN 378-3, 5.13, Abschnitt 8 und Abschnitt 9.
- Zusätzlich Prüfung von EN 378-2:2016, 6.2.14 für Kältemittel der Sicherheitsklassen 2L, 2 und 3, sofern zutreffend.

Die Aktivierung eines Normabschnitts bedeutet nicht, dass automatisch jede Einzelanforderung darin gilt. Jede Unteranforderung muss anhand ihres eigenen normativen Auslösers bewertet werden.

## Bereits identifizierte Prüfpunkte im Bestandscode

Der bisherige lesende Code-Audit hat unter anderem folgende Themen zur Prüfung markiert:

- Eigenständige Eingabe und Verarbeitung der möglichen Kältemittelansammlung fehlt.
- Grundanforderungen der Außenaufstellung sind nicht vollständig als getrennte Bewertungen modelliert.
- Die Zündquellenanforderung wird derzeit nicht von der Ansammlungsentscheidung abhängig gemacht.
- Detektionslogik vermischt Füllmengenbewertung, praktischen Grenzwert und das Vorhandensein eines Gaswarnsystems.
- Die Sonderbehandlung von R-717 gegenüber EN 378-3, 9.3.2 und 9.3.3 ist zu überprüfen.
- Die Abhängigkeiten zwischen Detektion, Alarmierung und mechanischer Notlüftung müssen anhand der jeweiligen Normauslöser neu geordnet werden.

Diese Punkte sind Prüfhinweise und vor Änderungen anhand des vollständigen Codes sowie der Regressionstests zu verifizieren.

## Erhalt bestehender Grundlagen

Die vorhandene Kältemitteldatenbank einschließlich praktischer Grenzwerte und Stoffeigenschaften soll weiterverwendet werden. Vorhandene Berechnungen, insbesondere der Luftstrom nach 5.13.4, sowie Ergebnis-, Speicher- und PDF-Strukturen sind auf Wiederverwendbarkeit zu prüfen. Eine Neuentwicklung erfolgt nur, wenn die fachliche Prüfung sie erfordert.

## Status

- [x] Neuer Arbeitsbranch angelegt.
- [x] Normpfad Außenaufstellung fachlich festgelegt.
- [ ] Implementierungsspezifikation vollständig gegen den Bestandscode verifiziert.
- [ ] Außenaufstellungslogik angepasst.
- [ ] Regressionstests ergänzt und ausgeführt.
- [ ] Weitere Aufstellorte schrittweise fachlich festgelegt und umgesetzt.

Bis zur abgeschlossenen fachlichen und technischen Prüfung erfolgen keine Änderungen an der produktiven Entscheidungslogik.
