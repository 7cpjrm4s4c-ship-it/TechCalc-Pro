# Phase 31C - Modulweiser Smoke Test

## Ziel

Release-Hardening vor `1.3.0-rc.1`: alle elf Produktionsmodule werden gegen die zentrale Plattform-UX geprüft.

## Geprüfte Kriterien

- Eingaben/Form-Schema vorhanden
- Saved-Record-Fähigkeit oder bewusst optionaler Status
- Enter-/Tab-Navigation über zentrale Event-Pipeline
- Scroll-Stabilität über zentrale Scroll-/Render-Infrastruktur
- Ergebnisanzeige vorhanden
- Reset-Pfad über Modul-State oder zentrale Projekt-Storage-Schicht
- Einheitenwechsel, sofern für das Modul relevant

## Ergebnis

`npm run test:module-smoke` meldet:

```text
Phase 31C module smoke audit: 11/11 pass, 0 review
```

## Geprüfte Module

- `buffer-storage`
- `drinking-water`
- `heat-recovery`
- `heating-cooling`
- `hx-diagram`
- `pipe-sizing`
- `pressure-holding`
- `rainwater`
- `unit-converter`
- `ventilation`
- `wastewater`

## Audit-Ablage

Audit-Artefakte gehören nicht ins Projekt-Root. Der neue Report liegt unter:

```text
docs/audits/json/module-smoke-audit-phase31c.json
```

Im Rahmen dieser Phase wurden zusätzlich verbliebene Root-Audit-Dateien in `docs/audits/json/` konsolidiert. Neue Audit-Skripte schreiben ebenfalls direkt in diesen Ordner.

## Entscheidung

Phase 31C ist releasefähig abgeschlossen. Es wurde kein Modul-Blocker für `1.3.0-rc.1` gefunden.
