# Phase 32B – Scroll- und P2-Härtung

## Ziel

Phase 32B stabilisiert die im RC-Review verbliebenen P2-/UX-Risiken rund um mobile Tastaturinteraktionen, Scrollsprünge und Trinkwasser-Speicheraktionen. Es wurden keine neuen Features eingeführt.

## Änderungen

- Zentrale Event-Pipeline markiert `data-tc-action`-Interaktionen bereits auf `pointerdown`/`touchstart` als committed action.
- Blur-Commits bleiben während laufender Aktionen silent, damit mobile Keyboard-Blur-Render den nachfolgenden Action-Klick nicht ersetzt.
- Trinkwasser-Speichern und -Löschen von Nutzungseinheiten/Einzelverbrauchern läuft in einem Scroll-Preservation-Block.
- Bestehende UI-Härtung gegen Textüberlauf und inkonsistente Feldhöhen bleibt Bestandteil des RC-Hardening-Pakets.
- Regressionstest `test:phase32b` ergänzt.

## Betroffene Bugs

- Schmutzwasser Mobile: Hinzufügen bei geöffneter Tastatur wird durch frühe Action-Markierung stabilisiert.
- Trinkwasser Mobile: Scrollsprünge beim Speichern/Löschen werden durch Scroll-Preservation reduziert.
- Trinkwasser: gespeicherte Verbraucher/Zusammenstellung bleiben aus 32A.2 unverändert abgesichert.
- UI-Overflow/Feldhöhen bleiben durch globale Card- und Trinkwasser-Dialog-Regeln gehärtet.

## Quality Gate

- `npm run build`
- `npm run audit:imports`
- `npm run test:phase32b`
- `npm test`
