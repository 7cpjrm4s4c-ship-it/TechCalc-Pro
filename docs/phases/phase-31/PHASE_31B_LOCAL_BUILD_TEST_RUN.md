# Phase 31B - Lokaler Build-/Testlauf

## Ziel

Release-Hardening fuer TechCalc Pro 1.3.x durch reproduzierbare lokale Gates:

- `npm install`
- `npm run build`
- `npm run test`
- `npm run audit:imports`
- Browser-Smoke-Test Vorbereitung

## Ergebnis

Phase 31B ist bestanden.

| Check | Ergebnis | Hinweis |
| --- | --- | --- |
| `npm install` | OK | Keine Dependencies zu installieren, 0 Vulnerabilities |
| `npm run build` | OK | Neu als statischer Syntax-/Import-Build-Gate ergaenzt |
| `npm run test` | OK | Quality Gate komplett bestanden |
| `npm run audit:imports` | OK | Alias auf zentralen JS-Syntax-/Import-Check ergaenzt |
| Browser Smoke Test | vorbereitet | Manuell in Phase 31C modulweise auszufuehren |

## Stabilisierungsaenderungen

### 1. Release-Gate-Skripte ergaenzt

`package.json` enthaelt jetzt die fuer Phase 31B erwarteten Skripte:

```json
"build": "node scripts/check-js-imports.mjs",
"audit:imports": "node scripts/check-js-imports.mjs"
```

Da TechCalc Pro aktuell eine statische Browser-App ohne Bundler ist, ist der Build-Schritt bewusst als reproduzierbares Syntax-/Import-Gate umgesetzt.

### 2. Import-/Syntax-Check beschleunigt

`scripts/check-js-imports.mjs` prueft weiterhin alle JS-/MJS-Dateien per `node --check`, startet die Checks aber parallel begrenzt. Dadurch bleibt das Gate lokal und in CI nutzbar.

Ergebnis:

```text
syntax check ok (350 files, concurrency 8)
```

### 3. Dokumentationspfade in Tests aktualisiert

Nach der Dokumentationsbereinigung aus Phase 30 wurden mehrere Dokumente nach `docs/phases/...` verschoben. Betroffene Tests wurden auf die neue Struktur aktualisiert:

- `tests/heating-cooling-phase12i.test.mjs`
- `tests/ventilation-global-standard.test.mjs`
- `tests/saved-record-controller-phase16b.test.mjs`
- `tests/platform-audit-framework-phase27a.test.mjs`

### 4. Scroll Manager fuer Test-/SSR-Umgebungen gehaertet

`js/core/scrollManager.js` referenziert `window` und `requestAnimationFrame` nicht mehr ungeprueft. Dadurch laeuft das zentrale Quality Gate auch in Node-Testumgebungen stabil.

### 5. Phase-11D-Test robuster gemacht

`tests/event-pipeline-phase11d.test.mjs` prueft weiterhin, dass Enter unmittelbar mit `notify: true` committet. Die Assertion wurde aber gegen legitime mehrzeilige Formatierung im Event-Pipeline-Code gehaertet.

## Quality-Gate-Status

```text
TechCalc quality gate ok
```

## Release-Bewertung

Keine neue Feature-Migration vorgenommen. Phase 31B beseitigt ausschliesslich Release-Gate- und Teststabilitaetsprobleme.

Naechster sinnvoller Schritt: Phase 31C - modulweiser Smoke Test.
