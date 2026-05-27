# TechCalc Pro UI-System ab 1.3.0

## Ziel

Die App gibt UI und UX zentral vor. Module liefern keine eigenen Komponenten mehr, sondern nutzen die Core-Renderer und die `tc-*` Primitives.

## Zentrale Primitive

- `tc-stack` fuer vertikale Inhaltsgruppen
- `tc-fields` fuer Formularraster
- `tc-list` / `tc-item` fuer Listen
- `tc-consumer-list` / `tc-consumer-row` fuer fachliche Mengen- oder Verbraucherlisten
- `tc-fixture-list` / `tc-fixture-row` fuer Einrichtungs-/Objektlisten
- `tc-accordion` / `tc-accordion__body` fuer aufklappbare Gruppen
- `tc-pill-list` / `tc-pill` fuer kompakte Tags
- `tc-add-row` fuer Inline-Ergaenzungen
- `tc-warning-list` / `tc-warning` fuer Hinweise, Normhinweise und Plausibilitaet
- `tc-help` / `tc-note` fuer Hilfetexte
- `tc-formula` fuer Formeln

## Regel fuer neue Module

Neue Module duerfen keine Klassen mit Modulprefix einfuehren, also keine neuen `dw-*`, `ph-*`, `hx-*`, `rainwater-*`, `wastewater-*` oder aehnliche UI-Klassen. Fachliche Selektoren bleiben als `data-*` Attribute erlaubt.

Erlaubt:

```html
<div class="tc-warning" data-module-warning="norm"></div>
```

Nicht erlaubt:

```html
<div class="overflow-warning-card"></div>
```

## Migrationsstrategie

Bestehende Modulklassen bleiben in Phase 3 als Aliasse im Markup, bekommen aber eine zentrale `tc-*` Klasse daneben. Beispiel:

```html
<div class="tc-warning ph-warning"></div>
```

Dadurch bleibt das UI stabil, waehrend neue Styles zentral ueber `tc-warning` laufen. In spaeteren Phasen koennen die alten Modulklassen entfernt werden.

## Abnahmekriterium

Bei jedem neuen Modul oder Refactor gilt:

1. UI nur ueber `renderer.js`, `moduleContract.js` oder `uiSystem.js` erzeugen.
2. Styling nur ueber zentrale CSS-Primitives.
3. Fachliches Verhalten nur ueber `data-*` Attribute anbinden.
4. Keine neuen modulbezogenen CSS-Regeln.
5. Der Audit `node scripts/audit-ui-classes.mjs` darf nur bekannte Legacy-Prefixe melden und muss bei Migrationen kleiner werden.
