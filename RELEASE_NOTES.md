# TechCalc Pro 1.3.0

TechCalc Pro 1.3.0 is the platform consolidation release.

Primary documentation:

- `docs/release-notes/RELEASE_NOTES_1.3.0.md`
- `docs/changelog/CHANGELOG_1.3.0.md`
- `docs/release/MIGRATION_SUMMARY_1.3.0.md`
- `docs/release/KNOWN_LIMITATIONS_1.3.0.md`

Release-hardening status after Phase 31D:

- Runtime review completed
- Local build/test/import gates established
- Module smoke audit completed for 11 active modules
- Audit artefacts stored under `docs/audits/json/`
- Release documentation consolidated

## 1.3.0-rc.1 / Phase 34B

- `components.css` neu aufgebaut und von 5027 auf 747 Zeilen reduziert.
- Globale UI-Komponenten zentralisiert; Modul-Ausnahmen nach `css/modules.css` isoliert.
- CSS-Quality-Gate ohne `!important` in `components.css` bestanden.
