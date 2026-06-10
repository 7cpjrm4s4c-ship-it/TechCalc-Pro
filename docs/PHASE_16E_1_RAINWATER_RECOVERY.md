# Phase 16E.1 – Rainwater Recovery

## Ziel
Regenwasser nach der Event-Pipeline-Konsolidierung wieder mountbar machen.

## Ursache
Das Regenwasser-Modul registriert nach Phase 16E einen zentralen Pipeline-Commit-Hook fuer Lookup-Hydration, importierte `registerPipelineCommitHandler` jedoch nicht aus `eventPipeline.js`. Dadurch wurde der Fehler erst beim Modul-Mount sichtbar: Navigation und Router funktionierten, aber `bindActions()` warf eine Runtime-Exception und der zentrale Runtime-Fehlerpfad zeigte „Modul konnte nicht geladen werden.“.

## Fix
`registerPipelineCommitHandler` wird in `js/modules/rainwater/index.js` explizit importiert.

## Regel
Module duerfen Pipeline-Hooks nutzen, muessen diese aber vollstaendig ueber die zentrale Event-Pipeline importieren und registrieren. Keine impliziten Globals.
