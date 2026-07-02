# Phase 36S – Deep Audit Tab/Enter + Spacing

Basis: `techcalc-pro-1.3.2-dev.1-rc.1-phase36q5a-focus-details-auto-open.zip`
## 1. Modulvergleich Event-/Focus-Pfade
### js/modules/heating-cooling
- `bindCentralEventPipeline`: False
- lokale `keydown` Handler: 0
- `handlePlatformFieldNavigation`: False
- `refresh...` im Keydown-Nahbereich: False
- `preserveFocusDuring`: False
- direkte `innerHTML` Assignments: 0

### js/modules/ventilation
- `bindCentralEventPipeline`: False
- lokale `keydown` Handler: 0
- `handlePlatformFieldNavigation`: False
- `refresh...` im Keydown-Nahbereich: False
- `preserveFocusDuring`: False
- direkte `innerHTML` Assignments: 0

### js/modules/pressure-holding
- `bindCentralEventPipeline`: False
- lokale `keydown` Handler: 0
- `handlePlatformFieldNavigation`: False
- `refresh...` im Keydown-Nahbereich: False
- `preserveFocusDuring`: False
- direkte `innerHTML` Assignments: 0

### js/modules/buffer-storage
- `bindCentralEventPipeline`: False
- lokale `keydown` Handler: 0
- `handlePlatformFieldNavigation`: False
- `refresh...` im Keydown-Nahbereich: False
- `preserveFocusDuring`: False
- direkte `innerHTML` Assignments: 0

### js/modules/hx-diagram
- `bindCentralEventPipeline`: False
- lokale `keydown` Handler: 1
- `handlePlatformFieldNavigation`: True
- `refresh...` im Keydown-Nahbereich: False
- `preserveFocusDuring`: True
- direkte `innerHTML` Assignments: 2

### js/modules/drinking-water
- `bindCentralEventPipeline`: False
- lokale `keydown` Handler: 2
- `handlePlatformFieldNavigation`: True
- `refresh...` im Keydown-Nahbereich: True
- `preserveFocusDuring`: True
- direkte `innerHTML` Assignments: 1

### js/modules/rainwater
- `bindCentralEventPipeline`: False
- lokale `keydown` Handler: 0
- `handlePlatformFieldNavigation`: False
- `refresh...` im Keydown-Nahbereich: False
- `preserveFocusDuring`: False
- direkte `innerHTML` Assignments: 0

### js/modules/wastewater
- `bindCentralEventPipeline`: False
- lokale `keydown` Handler: 1
- `handlePlatformFieldNavigation`: False
- `refresh...` im Keydown-Nahbereich: False
- `preserveFocusDuring`: False
- direkte `innerHTML` Assignments: 0

## 2. CSS-Befund Result-Rows
### `.card *, .tc-card *, .result-card *, .result-row *, .inline-stat *, .main-result *, .saved-record-card *, .line-section-card *`
```css
min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
```
### `/* Results ---------------------------------------------------------------- */ .result-list, .tc-result-list, .inline-stats, .result-groups, .line-section-list, .saved-record-list, .tc-list, .tc-consumer-list, .tc-saved-list, .tc-fixture-list, .dw-list, .dw-consumer-list, .dw-fixture-list, .ph-saved-list`
```css
display: grid; gap: var(--tc-gap); min-width: 0;
```
### `.result-row`
```css
display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--tc-gap);
  min-height: 36px;
  padding: var(--tc-gap) 0;
  border-bottom: 1px solid rgba(255,255,255,.08);
```
### `.result-row span`
```css
color: var(--color-muted);
```
### `.result-row strong`
```css
color: var(--color-text); font-size: 18px; line-height: 1.2; text-align: left; white-space: normal;
```
### `.result-row small`
```css
font-size: .85em; color: var(--color-text);
```
### `:root[data-theme='light'] strong, :root[data-theme='light'] .inline-stat strong, :root[data-theme='light'] .main-result strong, :root[data-theme='light'] .result-row strong`
```css
color: #101827;
```
### `.result-row`
```css
display: grid; grid-template-columns: 1fr;
```
### `/* Phase 35A: RC retest UI contract hardening. Keep spacing, menu sizing and result rows globally consistent after 34D rebuild. */ .module-content, .module-content > *, .tc-stack, .card, .tc-card, .card__body, .tc-card__body, .result-card__body, .result-list, .result-groups, .inline-stats, .line-section-list, .saved-record-list, [data-platform-dynamic], [data-pipe-dynamic], [data-ph-dynamic], [data-buffer-dynamic], [data-hx-dynamic], [data-dw-dynamic]`
```css
gap: var(--tc-gap);
```
### `.card, .tc-card, .result-card, .line-section-card, .saved-record-card, .ph-saved-item, .pipe-dimension-card, .inline-stat, .result-row, .main-result`
```css
min-width: 0;
  max-width: 100%;
  overflow: hidden;
```
### `.result-row, .inline-stat, .main-result, .pipe-result-head, .tc-result-item`
```css
padding: var(--tc-gap);
  border-radius: var(--radius-md);
```
### `.result-row > *, .inline-stat > *, .main-result > *, .pipe-result-head > *, .tc-result-item > *`
```css
min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  white-space: normal;
```
## 3. Vorläufige Hypothesen

### Tab/Enter
Wenn HX und Trinkwasser trotz 36R unverändert sind, liegt der Fehler sehr wahrscheinlich nicht nur in der Reihenfolge `commit -> focus -> RAF refresh`.
Die nächsten Kandidaten sind:

1. Die Module binden weiterhin eigene Keydown-Handler und umgehen damit `bindCentralEventPipeline`.
2. Der zentrale Pipeline-Handler ist in diesen Modulen eventuell gar nicht aktiv oder wird durch lokale `stopImmediatePropagation()` blockiert.
3. `focusManager.getPlatformFields()` sieht die gewünschten Felder nicht, weil sie nicht `data-field` tragen, disabled sind, in Details liegen oder nach dynamischem Render neu erzeugt werden.
4. Referenzmodule nutzen eine andere Bind-Reihenfolge: zuerst Pipeline, dann Actions; Problem-Module eventuell umgekehrt.

### Spacing
Wenn 36Q.5B keine Wirkung hatte, ist die Änderung vermutlich durch spätere CSS-Regeln überschrieben.
In `components.css` existiert nach der Basisregel eine spätere Sammelregel:

```css
.result-row,
.inline-stat,
.main-result,
.pipe-result-head,
.tc-result-item {
  padding: var(--tc-gap);
}
```

Diese Regel überschreibt `padding: 0` der früheren `.result-row`-Regel aufgrund späterer Cascade-Position.
Damit konnte 36Q.5B wirkungslos bleiben.
