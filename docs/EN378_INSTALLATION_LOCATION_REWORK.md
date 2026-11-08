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


## Verbindliche Ergänzung: Eingaben und Anlagenkonfiguration für den Außenpfad

### Anlagenkonfiguration und Prüfbereiche

Die Anlagenkonfiguration ist vor der Aufstellortbewertung zu unterscheiden:

- **Kompaktanlage / vollständige Außenaufstellung:** Alle kältemittelführenden Anlagenteile befinden sich im Außenbereich. Es wird ausschließlich die Außenaufstellung nach Abschnitt 4.2 bewertet.
- **Split- oder Multisplit-Anlage:** Es werden zwei getrennte Aufstellbereiche bewertet:
  1. Außeneinheit bzw. Außenaufstellung nach Abschnitt 4.2.
  2. Der kleinste Raum im Gebäude, in dem sich kältemittelführende Teile befinden. Dieser Raum wird später anhand des jeweils zutreffenden Abschnitts 4.2 bis 4.7 bewertet.

Die beiden Prüfbereiche sind unabhängig voneinander. Eine bestandene Außenbewertung ersetzt nicht die Gebäudeprüfung.

### Füllmengen-Eingabe

Für die Außenbewertung ist die **gesamte Kältemittelfüllmenge aller Anlagenteile** der Anlage maßgebend. Das gilt auch bei Split- und Multisplit-Anlagen. Die App übernimmt den vom Nutzer eingegebenen Gesamtwert; sie ermittelt oder verifiziert die Anlagenfüllmenge nicht selbst.

Am Eingabefeld für die Füllmenge ist deshalb ein eindeutiger Hinweis vorzusehen:

> Gesamte Kältemittelfüllmenge der Anlage einschließlich aller kältemittelführenden Anlagenteile eingeben.

Die korrekte Ermittlung und Plausibilitätsprüfung des eingegebenen Wertes liegt in der Verantwortung des planenden bzw. eingabenden Nutzers. Die App darf keine automatische Prüfung oder Ermittlung dieser Gesamtfüllmenge suggerieren.

### Definition „im Freien“

Die Bestätigung, dass die bauliche Situation die normative Definition „im Freien“ erfüllt, ist eine zwingende Eingangsvoraussetzung für den Außenpfad. Im aktuellen Umfang erfolgt diese Bestätigung durch den Planer.

Die geometrischen Kriterien der Definition werden zunächst nicht durch die App berechnet. Insbesondere wird keine automatische Prüfung der freien Luftschlitzfläche oder der Wandflächenabdeckung implementiert. Die Verantwortung für die korrekte Einordnung und Bestätigung liegt beim Planer.

### Grundanforderungen der Außenaufstellung nach Abschnitt 4.2

Nach bestätigter Definition „im Freien“ sind folgende Grundanforderungen getrennt zu bewerten:

- **Sichere Anordnung:** Austretendes Kältemittel darf keine Personen oder Sachwerte gefährden.
- **Schutz vor Eindringen:** Kältemittel darf nicht in Frischluftöffnungen, Türen, Bodenklappen oder vergleichbare Gebäudeöffnungen eindringen können.
- **Schutzabdeckung:** Es ist anzugeben, ob eine Schutzabdeckung vorhanden ist. Nur wenn dies der Fall ist, wird die ausreichende natürliche oder mechanische Belüftung der Abdeckung bewertet. Ohne Schutzabdeckung ist diese Teilprüfung nicht anwendbar.

Erst wenn die Definition „im Freien“ bestätigt und alle anwendbaren Grundanforderungen erfüllt sind, wird die folgende Planerentscheidung freigeschaltet.

### Planerentscheidung: „Kältemittelansammlung möglich“

Die bisherige technische Bezeichnung „Punkt 5“ wird in der Benutzeroberfläche nicht verwendet. Die verständliche Bezeichnung lautet:

**Kältemittelansammlung möglich**

Die Bewertung erfolgt ausschließlich manuell durch den Planer mit Ja oder Nein. Die App leitet diese Entscheidung nicht automatisch aus Kältemittel, Sicherheitsklasse, Füllmenge oder anderen Eingaben ab.

- **Nein:** Keine Aktivierung der zusätzlichen Folgeprüfungen aus diesem Ansammlungs-Folgepfad.
- **Ja:** Die jeweils anwendbaren Anforderungen aus EN 378-3, 5.13, Abschnitt 8 und Abschnitt 9 sowie – bei Sicherheitsklassen 2L, 2 und 3 – die eigenständige Zusatzprüfung nach EN 378-2:2016, 6.2.14 werden aktiviert.
- **Nicht bewertet:** Der Außenpfad bleibt unvollständig.

Die Aktivierung eines Abschnitts bedeutet nicht, dass sämtliche Unteranforderungen pauschal gelten. Jede Unteranforderung ist weiterhin anhand ihres eigenen normativen Auslösers zu bewerten.

### Abgrenzung EN 378-2, 6.2.14

Der Verweis auf EN 378-2:2016, 6.2.14 ist eine eigenständige Zusatzanforderung für die genannten Sicherheitsklassen. Er ist nicht mit alternativen Sicherheitsmaßnahmen oder alternativen Vorkehrungen nach anderen Abschnitten zu verwechseln. Diese alternativen Maßnahmen werden in einem späteren Arbeitsschritt gesondert betrachtet.

### Statuslogik

- Eine nicht erfüllte Grundanforderung führt dazu, dass der Außenpfad nicht bestanden ist. Die Entscheidung „Kältemittelansammlung möglich“ wird dadurch nicht automatisch auf Nein gesetzt.
- Fehlende Pflichtangaben bleiben „not-assessed“; sie dürfen nicht als erfüllt interpretiert werden.
- Eine Teilprüfung ohne Schutzabdeckung erhält „not-applicable“.
- Der Außenpfad ist nur dann bestanden, wenn die Eingangsvoraussetzung bestätigt und alle anwendbaren Anforderungen erfüllt sind.

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
- [x] Außenaufstellungslogik für die Grundanforderungen strukturiert.
- [x] Erste Regressionstests ergänzt.
- [ ] Bedingte Folgeprüfungen nach 5.13, Abschnitt 8 und Abschnitt 9 vollständig implementiert und ausgeführt.
- [ ] Weitere Aufstellorte schrittweise fachlich festgelegt und umgesetzt.

Bis zur abgeschlossenen fachlichen und technischen Prüfung erfolgen keine Änderungen an der produktiven Entscheidungslogik.
