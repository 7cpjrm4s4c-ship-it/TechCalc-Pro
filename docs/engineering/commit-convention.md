# Commit Convention

TechCalc Pro verwendet Conventional-Commit-aehnliche Commit-Nachrichten.

## Typen

- `feat:` neue Funktion
- `fix:` Fehlerkorrektur
- `refactor:` Struktur-/Architekturaenderung ohne fachliche Funktionsaenderung
- `docs:` Dokumentation
- `test:` Tests oder Audits
- `build:` Build, Service Worker, Precache, Packaging
- `chore:` Wartung ohne Produktverhalten

## Beispiele

```text
refactor(keyboard): remove legacy drinking-water key handlers

docs(phase42): document mobile input contract

test(audit): add keyboard contract regression guard

build(sw): synchronize precache manifest
```

## Regeln

- Ein Commit hat einen klaren Scope.
- Kein Mischcommit aus UI, Logik, Dokumentation und Build, wenn trennbar.
- Architekturentscheidungen werden nicht nur im Committext dokumentiert, sondern in Contracts oder ADRs.
