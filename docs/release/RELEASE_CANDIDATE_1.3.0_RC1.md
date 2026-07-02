# Release Candidate 1.3.2-dev.2-rc.1

Date: 2026-06-11
Phase: 31E - Release Candidate

## Decision

TechCalc Pro is marked as `1.3.2-dev.2-rc.1` after completion of the Phase 31 release-hardening block.

## Included gates

- Phase 31A / 31A.1: runtime review completed; obsolete `menuFallback.js` removed.
- Phase 31B: local install/build/test/import-audit gate established and passed.
- Phase 31C: module smoke audit completed for all 11 production modules; audit files consolidated under `docs/audits/json/`.
- Phase 31D: release notes, changelog, migration summary and known limitations documented.

## Release freeze rules

Allowed after `1.3.2-dev.2-rc.1`:

- Bug fixes
- Regression fixes
- Documentation corrections
- Test or audit fixes needed to keep the release gate reproducible

Not allowed before final `1.3.2-dev.2` unless explicitly approved:

- New feature migrations
- Large refactorings
- New platform abstractions
- Non-critical UI redesign
- Removal of compatibility facades that protect migrated modules

## Manual RC checklist

Before promoting `1.3.2-dev.2-rc.1` to final `1.3.2-dev.2`, confirm in the browser:

- App loads without console errors.
- Navigation between all modules works.
- Enter/Tab input navigation works in desktop forms.
- Saved-record selection and deselection do not cause scroll jumps.
- Result rendering updates immediately after input and saved-record changes.
- Reset works module by module.
- Unit switching works in modules that expose unit controls.
- Desktop and mobile layouts remain usable.

## Status

Automated RC gate: passed.
Browser smoke test: pending on target machine/browser.
