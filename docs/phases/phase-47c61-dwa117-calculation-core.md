# Phase 47C.6.1 – Fachlicher Berechnungskern DWA-A 117

## Umfang

Dieser Unterblock implementiert ausschließlich den deterministischen Rechenkern des einfachen Verfahrens nach dem verbindlichen Contract aus Phase 47B.1. UI, automatische Anwendungsprüfung, normative Ableitung von `fz` und `fA`, PDF-Ausgabe und vollständiger Dauerstufen-Workflow folgen in den weiteren Unterblöcken von 47C.6.

## Implementiert

- kanonische State-Felder für den Rückhalteraumnachweis,
- Ermittlung der abflusswirksamen Fläche `Au = Σ(A × Cm) / 10000`,
- Ermittlung des für Regen verfügbaren Drosselabflusses,
- Ermittlung von `qDr,R,u`,
- Berechnung je Dauerstufe:

  `Vs,u = (r(D,n) − qDr,R,u) × D × fz × fA × 0,06`

  `V = Vs,u × Au`

- deterministische Sortierung der Dauerstufen,
- Auswahl des größten gültigen Volumens,
- Begrenzung negativer Ergebnisse auf `0` bei Erhalt des ungerundeten Rohwerts,
- Aktivierung ausschließlich im Modus `authority-discharge-limit`,
- unveränderliche Ergebnisobjekte,
- Integration in das bestehende Calculation Model ohne parallelen Berechnungszustand.

## Bewusste Grenze dieses Unterblocks

`fz` und `fA` werden in 47C.6.1 als fachlich geprüfte Eingabewerte an den Rechenkern übergeben. Ihre automatische Ableitung und die Prüfung der normativen Gültigkeitsbereiche sind Bestandteil von 47C.6.2. Dadurch wird keine nicht dokumentierte normative Formel vorgezogen oder stillschweigend angenommen.

## Regression

`tests/flooding-verification-phase47c61-dwa117-core.test.mjs` prüft:

- die Formel für `Vs,u` und `V`,
- negative Rohwerte,
- `Au` und `qDr,R,u`,
- die Auswahl der maßgebenden Dauerstufe,
- Inaktivität außerhalb der behördlichen Einleitungsbegrenzung,
- Integration ohne Änderung des Überflutungsnachweises aus 47C.5.
