# Phase 30D - Controlled Cleanup Batch

## Ziel

Phase 30D fuehrt die erste echte Bereinigung nach dem Struktur-Audit aus. Der Fokus liegt bewusst auf risikoarmen Struktur- und Artefaktbereinigungen. Runtime-Dateien, Exports und historische Tests werden nicht geloescht, solange nur ein statischer Kandidatenstatus vorliegt.

## Umgesetzte Bereinigung

- Top-level Phase-Dokument `docs/PHASE_30C_DOCUMENTATION_REORGANIZATION.md` nach `docs/phases/phase-30/` verschoben.
- Root-/Docs-Cleanup-Policy durch Audit-Script pruefbar gemacht.
- Bekannte exakte Duplicate-Gruppe `rainwater/index.js` und `wastewater/index.js` als intentionaler Platform-Wrapper klassifiziert.
- Runtime-Dead-Code-Kandidaten aus 30B als Review-Kandidaten beibehalten, nicht geloescht.
- Historische Tests bleiben aktiv archiviert, solange sie im Quality Gate oder in Package-Scripts verwendet werden.

## Nicht geloescht

Folgende Gruppen bleiben aus Sicherheitsgruenden unveraendert:

- Runtime-Dateien mit moeglicher dynamischer Verwendung.
- Export-Kandidaten, die durch dynamische Verwendung, Tests oder zukuenftige Module relevant sein koennen.
- Phase-Tests, die durch `scripts/quality-gate.mjs` oder Package-Scripts erreichbar sind.

## Ergebnis

30D reduziert die sichtbare Strukturverschmutzung ohne Release-Risiko. Die eigentliche finale Baseline folgt in 30E mit Build-/Import-/Quality-Gate-Pruefung.
