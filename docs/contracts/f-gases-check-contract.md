# F-Gases Check Contract

Status: Verbindlicher Release-Contract für Version 1.5.0
Stand: 2026-08-28

## Scope
Das Modul bewertet regulatorische Anforderungen für Kälte-, Klima- und Wärmepumpenanlagen über den relevanten Anlagenlebenszyklus. EN-378-Sicherheitsbewertungen bleiben ausgeschlossen.

## State-Contract
Schema-Version 5 trennt `placedOnMarketDate` (erstmaliges Inverkehrbringen), `commissioningDate` (erstmalige Inbetriebnahme) und `stockAssessmentDate` (Prüfdatum einer Bestandsanlage). `plannedActivity` ist für neue Zustände standardmäßig `installation`; bei expliziten Nicht-Installations-Tätigkeiten wird das Bestandsprüfdatum verwendet. Legacy-Felder `installedAtSiteDate` und `assessmentDate` werden bei der Migration auf die aktuellen Felder abgebildet.

## Regulatorische Auswertung
Die Rule-Engine liefert mindestens Inverkehrbringungsprüfung einschließlich Anhang-IV-Verbotsdatum und Altprodukt-Nachweis, Serviceprüfung, Dichtheitskontrollpflicht und Intervall, Leckage-Erkennungssystem, Dokumentationspflichten, Zertifizierung sowie deutsche Betreiberpflichten einschließlich spezifischem Kältemittelverlust. Fehlende rechtlich notwendige Eingaben führen zu `incomplete`/`unresolved`, niemals zu einer unterstellten Freigabe. AIV-007D bleibt wegen des nicht eindeutigen Vergleichsoperators `manual-review`.

Serviceverbote nach Art. 13 VO (EU) 2024/573 und die HFKW-Quote nach Art. 17 i. V. m. Anhang VII werden getrennt bewertet. Die Quote ist keine direkte Wartungs- oder Verwendungsverbotsregel.

## Dichtheitskontrolle
Art. 5 Abs. 1 wird für Anhang-I-Gase ab 5 t CO2-Äquivalent und Anhang-II-Gruppe-1-Gase ab 1 kg ausgewertet. Die gekennzeichnete hermetische Ausnahme und die Intervalle nach Art. 5 Abs. 6 werden berücksichtigt. Für mobile Einrichtungen nach Art. 5 Abs. 3 Buchst. b und c gilt die dokumentierte Übergangsregel.

## Dokumentation
Bei Dichtheitskontrollpflicht wird die Aufzeichnungspflicht nach Art. 7 mit fünfjähriger Aufbewahrung ausgewiesen. Altprodukt-Nachweise und die deutsche Erklärungspflicht nach § 12i Abs. 2 ChemG werden separat ausgewiesen.

## Betreiberpflichten Deutschland
§ 2 ChemKlimaschutzV wird anhand Anlagenart, Aufstellung, Füllmenge, Inbetriebnahmedatum und hermetischem Status ausgewertet. Die Ausnahme nach § 2 Abs. 3 wird nur angewendet, wenn die Anlage die technischen Kriterien einer hermetisch geschlossenen Einrichtung erfüllt und entsprechend gekennzeichnet ist. § 14 wird für Dichtheitskontrollen, Rückgewinnung und übertragene Tätigkeiten über die vorhandenen Zertifizierungsstatus berücksichtigt.

## Plattform und Ausgabe
Kältemittel-, GWP- und Rechtsdaten werden ausschließlich über `js/utils/refrigerants/refrigerant-service.js` bzw. `index.js` genutzt. Snapshot-, Persistenz-, PDF- und Modul-Runtime-Infrastruktur werden wiederverwendet. Die F-Gase-PDF-Ausgabe nutzt den zentralen PDF-Renderer und den optionalen Dokumenttitel `Informationsblatt`.

## Release-Gate
Alle `tests/f-gases-*.test.mjs` des Release-Standes sind Bestandteil des dedizierten `test:f-gases`-Gates. Zusätzlich bleiben die projektweiten Test-, Flooding-, Integrations-, Build- und E2E-Gates maßgeblich.
