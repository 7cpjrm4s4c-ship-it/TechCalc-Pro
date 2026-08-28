# ADR-0010: Zentrale Release-Version als Single Source of Truth

Status: Angenommen
Datum: 2026-08-28

## Kontext
Die App-Release-Version war historisch in Runtime-, PWA-, PDF- und UI-Dateien separat gepflegt. Dadurch konnten Package-Metadaten, Service Worker, Manifest, App-Anzeige und PDF-Metadaten voneinander abweichen.

## Entscheidung
1. `package.json#version` ist die einzige manuell gepflegte App-Release-Version.
2. `scripts/sync-release-version.mjs` synchronisiert alle statischen Verbraucher: Lockfile-Root, Manifest, browserfähiges Versionsmodul, App-Runtime-Metadaten, Release-Notes-Defaults, sichtbare/Feedback-Versionen und Flooding-PDF-Metadaten.
3. `scripts/generate-precache-manifest.mjs` führt diese Synchronisierung vor der Erzeugung des Service Workers aus und leitet Cache-Name, Cache-Revision und Precache-Liste aus derselben Package-Version ab.
4. Ein Release-Wechsel erfordert ausschließlich die Änderung von `package.json#version`; die übrigen App-Versionen sind generierte Artefakte und dürfen nicht manuell gepflegt werden.
5. Fachliche Daten-, Schema-, DTO- und Rechtsdatenversionen sind keine App-Release-Versionen und bleiben unabhängig.
6. `version:check`, Release-Readiness, Regressionstests und CI blockieren inkonsistente Ableitungen.

## Folgen
- Release-Versionen können nicht mehr unabhängig auseinanderlaufen.
- PWA-/Offline-Versionierung und PDF-Metadaten folgen automatisch dem Release.
- Der Build bleibt deterministisch und benötigt keine zusätzliche Runtime-Abhängigkeit.
- Bestehende Dependency-Injection-Schnittstellen der Shell bleiben erhalten.

## Referenzen
- `package.json`
- `scripts/sync-release-version.mjs`
- `scripts/generate-precache-manifest.mjs`
- `js/core/version.js`
- `docs/contracts/release-version-contract.md`
