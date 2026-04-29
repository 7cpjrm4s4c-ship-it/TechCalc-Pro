# TechCalc Pro — CSS Audit Phase 7

## Messwerte

- CSS-Dateien im Paket: 5
- `!important`-Vorkommen in CSS: 638
- Inline-Style-Attribute in `index.html`: 157
- `tcp-*` Referenzen in `index.html`: 156

## Bewertung

Phase 7 stabilisiert die App nicht durch vollständiges Löschen alter Regeln, sondern durch eine engere V7-Kaskadeklammer. Das ist bewusst risikoärmer, weil die App sichtbar läuft und die Legacy-Regeln noch als Fallback existieren.

## Noch offen

- `!important` ist weiterhin hoch, weil `layout.css` und ältere Modulregeln noch im Paket liegen.
- `index.html` enthält weiterhin Inline-Styles. Diese sollten in Phase 8/9 schrittweise in `tcp-*` Utilities überführt werden.
- `components.css` und `layout.css` sollten in der nächsten Phase entweder bereinigt oder klar als Legacy/PDF-only getrennt werden.

## Empfehlung

Ab Phase 8 sollte jede Änderung messbar Legacy reduzieren: weniger Inline-Styles, weniger `!important`, weniger Tab-ID-Selektoren.
