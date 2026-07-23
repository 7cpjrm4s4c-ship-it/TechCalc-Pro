# Phase 47C.6.3 – DWA-A 117 Dauerstufenvergleich

## Ziel

Die in 47C.6.1 berechneten Dauerstufen werden in ein deterministisches, unveränderliches Vergleichsmodell überführt. UI und späterer PDF-Export verwenden dieselben Rohwerte.

## Vergleichsmodell

Für jede Dauerstufe werden dokumentiert:

- Dauer D,
- Regenspende r(D,n),
- Regenanteil der Drosselabflussspende qDr,R,u,
- Zuschlagsfaktor fz,
- Abminderungsfaktor fA,
- spezifisches Speichervolumen Vs,u,
- Gesamtrückhaltevolumen V,
- Validitäts- und Diagnosezustand.

Die Einträge werden unabhängig von der Eingabereihenfolge aufsteigend nach der Dauer sortiert. Die Rangfolge wird absteigend nach dem Speichervolumen bestimmt. Bei identischen Maximalwerten ist deterministisch die kürzere Dauer maßgebend.

## Diagnose

Ungültige Dauerstufen werden nicht stillschweigend verworfen. Negative Rohwerte bleiben im Berechnungsergebnis erhalten, werden für den anzusetzenden Wert auf 0 begrenzt und im Vergleichsmodell gekennzeichnet.

## Plattformkonformität

Es wurden keine eigenen UI-Komponenten oder CSS-Regeln eingeführt. Die Ausgabe erfolgt über das zentrale Result Model und den bestehenden Result Renderer.

## Tests

`tests/flooding-verification-phase47c63-duration-comparison.test.mjs` deckt Sortierung, Rangfolge, Gleichstand, Diagnose und Unveränderlichkeit ab.
