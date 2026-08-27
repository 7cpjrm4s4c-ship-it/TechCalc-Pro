# F-Gases Check – Kältemittel- und GWP-Daten

Status: Implementierungsreferenz für Version 1.5.0  
Stand: 2026-08-27

## Quellen

- Umweltbundesamt: `Treibhauspotentiale (Global Warming Potential, GWP) ausgewählter Verbindungen und deren Gemische gemäß Viertem (AR4) und Fünftem (AR5) IPCC Sachstandsbericht sowie Verordnung (EU) 2024/573`, Stand März 2026.
- Verordnung (EU) 2024/573, insbesondere Artikel 2 und 3 sowie Anhänge I und II.

## Trennung der Datenverantwortung

`refrigerants.js` enthält Stammdaten, Zusammensetzungsreferenzen und die für die Rechtslogik benötigte Stoffklassifikation. `gwp.js` enthält ausschließlich die GWP-Werte und deren Datenquellen. Die öffentliche Nutzung erfolgt weiterhin ausschließlich über `refrigerant-service.js` beziehungsweise `index.js`.

## GWP-Modell

AR4, AR5 und der für die F-Gas-Verordnung ausgewiesene GWP-Wert werden getrennt gespeichert. Der kompatible Servicewert `value` entspricht ausschließlich `fGasRegulation`; dadurch verwendet die bestehende CO2-Äquivalent-Berechnung den regulatorischen Wert, ohne AR4 oder AR5 mit diesem zu vermischen.

Für halogenfreie Stoffe enthält die UBA-Tabelle keine AR5-Spalte. Diese Werte werden deshalb als `null` gespeichert und nicht ergänzt.

## Regulatorische Klassifikation

Die Verordnung definiert HFKW als Stoffe aus Anhang I Gruppe 1 oder Gemische, die einen solchen Stoff enthalten. Ungesättigte teil(chlor)fluorierte Kohlenwasserstoffe wie HFKW-1234yf und HFKW-1234ze sind in Anhang II Gruppe 1 aufgeführt. Halogenfreie Kältemittel aus UBA-Tabelle 3 werden nicht als fluorierte Treibhausgase klassifiziert.

Die Stammdaten speichern deshalb explizit:

- `fluorinatedGreenhouseGas`,
- `hfc`,
- `annexIGroup1Content`,
- `annexIIGroup1Content`.

Diese Merkmale sind Datenbasis für eine spätere Rule-Engine und keine bereits ausgeführte Rechtsbewertung.

## Umfang Datenversion 1.0.0

Die erste produktive Datenversion enthält die für den vereinbarten Kälte-/Klima-/Wärmepumpen-Kernscope priorisierten Reinstoffe, natürlichen Kältemittel und gebräuchlichen HFKW/HFO-Gemische aus der bereitgestellten UBA-Liste. Die UBA-Unterlage enthält weitere Verbindungen und weitere Blends; diese werden nicht stillschweigend als Bestandteil der Version 1.0.0 behauptet.

Eine Erweiterung der Stammdaten erfolgt ausschließlich quellenbasiert und erhöht die jeweilige Datenversion.
