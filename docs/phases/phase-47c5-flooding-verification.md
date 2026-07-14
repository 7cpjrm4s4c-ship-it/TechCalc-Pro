# Phase 47C.5 – Überflutungsnachweis

## Status

Implementiert auf dem Feature-Branch `Feature/Überflutungsnachweis`.

## Verbindliche Grundlage

- `docs/contracts/flooding-verification-contract.md`
- DIN-1986-100-Vorgaben gemäß den im Projekt bereitgestellten Unterlagen
- Gleichung (20) und Gleichung (21) gemäß Contract
- zentrale Plattformverträge für State, Rendering, Saved Records, Zahlen und Ergebnisdarstellung

## Implementierungsumfang

### Gleichung (20)

Für die automatisch oder begründet manuell gewählte Regendauer `D` wird berechnet:

```text
VRück,20 =
(r(D,30) × Ages − r(D,2) × Σ(Ai × Cs,i))
× D × 60 / (10000 × 1000)
```

Der Abflussbeiwert wird ausschließlich im Term des Bemessungsregens `r(D,2)` berücksichtigt.

### Gleichung (21)

Für jede Dauerstufe `D = 5, 10, 15 min` wird berechnet:

```text
VRück,21,D =
(r(D,30) × Ages / 10000 − Qab)
× D × 60 / 1000
```

`Qab` stammt abhängig vom gewählten Betriebsmodus aus:

- dem dokumentierten Tabellenwert `Qvoll`,
- dem manuell vorgegebenen Vollfüllungsabfluss,
- oder der behördlich vorgegebenen maximalen Einleitungsmenge.

Der größte gültige Wert der drei Dauerstufen wird als Ergebnis der Gleichung (21) markiert.

### Ergebnisvergleich

Ohne DWA-A-117-Berechnung wird das größere Volumen aus Gleichung (20) und dem Maximum der Gleichung (21) als maßgebendes Rückhaltevolumen ausgewiesen. Die Herkunft und Dauer bleiben im Ergebnis erhalten.

### Numerische Regeln

- Berechnung mit voller JavaScript-Präzision
- keine Zwischenrundung
- Rundung nur im Result Model
- negative Volumina werden auf `0 m³` begrenzt
- der negative Rohwert und die Begrenzung werden diagnostiziert
- fehlende Pflichtwerte erzeugen keinen stillen Fallback

### Sonderhinweise

- kritischer Flächenanteil über 70 %: Hinweis zur zusätzlichen Prüfung der Notentwässerung mit `r(5,100)`
- behördliche Einleitungsbegrenzung: Hinweis auf Phase 47C.6 / DWA-A 117

## Ergebnis- und Persistenzintegration

Das zentrale Result Model enthält:

- maßgebendes Rückhaltevolumen,
- maßgebende Gleichung und Dauer,
- vollständige Einsetzwerte der Gleichung (20),
- Dauerstufenwerte der Gleichung (21),
- verwendeten Abfluss `Qab` und dessen Quelle,
- befestigten und kritischen Flächenanteil,
- Warnungen und Diagnoseflags.

Saved Records speichern zusätzlich den Ergebnisvergleich und das maßgebende Volumen als reproduzierbaren Snapshot. Der kanonische Eingabestate bleibt die einzige Berechnungsquelle.

## Regressionstests

`tests/flooding-verification-phase47c5.test.mjs` prüft:

- korrekte Einheitenumrechnung und Termstruktur von Gleichung (20),
- korrekte Verwendung von `Qab` in Gleichung (21),
- Begrenzung negativer Volumina,
- Vergleich aller Dauerstufen 5/10/15 min,
- Auswahl des größeren Ergebnisses aus Gleichung (20) und (21),
- Verwendung einer behördlichen Begrenzung als `Qab`,
- Folgehinweis auf DWA-A 117.

## Abgrenzung

Nicht Bestandteil dieser Phase ist die Berechnung nach DWA-A 117. Diese folgt in Phase 47C.6 und wird nicht mit dem Überflutungsvolumen begrifflich vermischt.
