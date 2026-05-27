# TechCalc Pro 1.3.0 - Quality Gates / Marktreife

Phase 5 macht aus dem Refactor eine belastbare Release-Basis. Ziel ist nicht mehr nur Funktion, sondern reproduzierbare Qualitaet bei jeder Aenderung.

## Verbindliche Gates vor Merge / Release

```bash
npm test
```

Der Quality Gate fuehrt aus:

1. JS-Syntaxcheck fuer alle `.js` und `.mjs` Dateien
2. Regressionstest fuer deutsche Zahleneingabe
3. Plattform-Policy-Test
4. Modulvertrag-Test ueber alle registrierten Modulkonfigurationen
5. Modul-Contract-Audit
6. UI-Legacy-Audit

## Harte Produktregeln

- Neue Module duerfen keine eigenen CSS- oder UI-Komponenten einfuehren.
- Neue Module muessen den Modulvertrag 1.3.0 verwenden.
- Zahlen werden ausschliesslich ueber `numberService` verarbeitet.
- Saved Records und Scroll-Verhalten werden zentral gesteuert.
- Lazy Loading bleibt Pflicht fuer Module, PDF Export und schwere Tabellen.

## Performance Budget

Die Datei `js/core/quality/performanceBudget.js` definiert die Zielwerte:

- Modul-Mount: maximal 80 ms
- Route-Render: maximal 120 ms
- Resize-Render: maximal 32 ms
- Initial Blocking: maximal 150 ms
- DOM Nodes pro Modul: maximal 1200

Diese Werte sind bewusst streng, damit die App auch mobil stabil bleibt.

## Bekannte Migration Debt

Der UI-Audit meldet in Phase 5 weiterhin Legacy-Klassen wie `dw-*`, `ph-*`, `hx-*`, `rainwater-*` und `wastewater-*`. Das ist fuer bestehende Module noch toleriert, aber ab 1.3.0 gilt:

- Keine neuen modulbezogenen Klassen.
- Jede Modulmigration muss die Trefferzahl senken.
- Zielzustand: 0 Legacy-UI-Treffer.

## Empfohlene naechste Migrationen

1. Trinkwasser auf SavedRecordController + tc-* UI umstellen.
2. h,x Diagramm CSS auf neutrale Chart-/Process-Primitives umstellen.
3. Druckhaltung/Pufferspeicher von `ph-*` befreien.
4. Regenwasser/Schmutzwasser weiter von Legacy-Renderer-Strukturen entkoppeln.
5. Ueberflutungsnachweis ausschliesslich als schema-basiertes Modul bauen.
