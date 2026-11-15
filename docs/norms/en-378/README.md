# Normauszüge DIN EN 378

## Zweck

Dieses Verzeichnis enthält die für die Umsetzung des Moduls `en-378-safety-check`
erforderlichen normativen Festlegungen als pflegbare Auszüge. Die Auszüge sind die
git-Versionierte Referenz für Code-Konstanten unter `core/data/norms/en378/` und für
die Spezifikationsdokumente unter `docs/contracts/en378/`.

## Lizenzgrundlage

Die DIN EN 378 wird innerbetrieblich unter den bestehenden Firmenlizenzen genutzt
(Beuth Verlag, Lizenznehmer: siehe Projektunterlagen). Die Auszüge dienen ausschließlich
der innerbetrieblichen Softwareentwicklung und dem innerbetrieblichen Betrieb von
TechCalc Pro. Eine Weitergabe an Dritte ist nicht zulässig.

## Editionsstand

| Normteil | Ausgabe | Enthält |
| — | — | — |
| DIN EN 378-1:2021-06 (EN 378-1:2016+A1:2020) | 2021-06 | Klassifikationen, Anhang C |
| DIN EN 378-2 (EN 378-2:2016) | nachgereicht | Auslegung, 6.2.14, Abschnitt 7 |
| DIN EN 378-3:2020-12 (EN 378-3:2016+A1:2020) | 2020-12 | Aufstellungsorte, Maschinenräume |

## Pflegeprozess

1. Bei Normänderungen (Neuausgabe, Berichtigung) werden die Auszüge zunächst
   aktualisiert und die Änderung dokumentiert.
2. Anschließend werden die Konstanten unter `core/data/norms/en378/` abgeglichen.
3. Regressionstests, die auf Normstellen referenzieren, werden angepasst und müssen
   grün sein, bevor der Pull Request gemergt wird.
4. Jede Änderung an diesem Verzeichnis erfolgt im eigenen Commit mit der Angabe
   der Normstelle im Commit-Message.

## Regel

Ausschließlich aus diesem Verzeichnis (bzw. den daraus abgeleiteten Konstanten unter
`core/data/norms/en378/`) dürfen normative Grenzwerte in das Modul übernommen werden.
Werte aus Sekundärquellen (Fachliteratur, Websites) sind unzulässig.
