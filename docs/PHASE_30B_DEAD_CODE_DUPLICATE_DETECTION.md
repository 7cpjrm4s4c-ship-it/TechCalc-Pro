# Phase 30B - Dead Code and Duplicate Detection

## Ziel

Phase 30B klassifiziert potenziell toten Code, Duplikate und historische Test-/Audit-Artefakte. Diese Phase löscht bewusst nichts. Sie erzeugt die Entscheidungsgrundlage für Phase 30C und 30D.

## Prüfachsen

- Runtime-Dateien ohne statische Eingangsreferenz
- unreferenzierte Tests und Scripts
- exakte Datei-Duplikate per SHA-256
- doppelte Dateinamen über Ordnergrenzen hinweg
- ungenutzte Export-Kandidaten
- unresolved relative imports

## Ergebnis

- P0: keine
- P1: keine, sofern der Importgraph keine unresolved relative imports meldet
- P2: Kandidatenlisten für manuelle Bereinigung

## Bereinigungsregel

Keine automatische Löschung in 30B. Eine Datei darf erst in 30D entfernt oder verschoben werden, wenn alle drei Bedingungen erfüllt sind:

1. keine Runtime-Referenz
2. keine Package-Script-Referenz
3. keine relevante Dokumentations-/Audit-Abhängigkeit

## Artefakte

- `scripts/audit-dead-code-duplicates-phase30b.mjs`
- `tests/platform-dead-code-duplicates-phase30b.test.mjs`
- `dead-code-duplicate-audit-phase30b.json`
