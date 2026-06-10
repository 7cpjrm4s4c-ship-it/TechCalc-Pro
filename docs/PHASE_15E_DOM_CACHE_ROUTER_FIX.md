# Phase 15E – DOM Cache Router Fix

## Ursache

Der globale Router schrieb beim Modulwechsel direkt die Lade-Card `Modul wird geladen...` in den App-Root. Einige Module ersetzen den DOM-Inhalt danach über `safeReplaceContent`, andere Referenzmodule schreiben weiterhin direkt per `root.innerHTML`. Dadurch konnte `root.__tcLastHtml` auf dem HTML eines zuvor gerenderten Moduls stehen bleiben.

Beim erneuten Wechsel auf ein Modul mit identischem View-HTML übersprang `safeReplaceContent` die Ersetzung, obwohl der reale DOM-Inhalt nur die Lade-Card enthielt. Ergebnis: Navigation markiert korrekt, aber der Content bleibt bei `Modul wird geladen...`.

## Fix

- `safeReplaceContent` überspringt nur noch, wenn Cache **und realer DOM** identisch sind.
- Modul-Lifecycle-Cleanup löscht den DOM-Render-Cache.
- Der Router invalidiert den Cache explizit vor der Lade-Card.

## Ziel

Der Modulwechsel bleibt stabil, auch solange moderne und Legacy-Module unterschiedliche Low-Level-Renderpfade verwenden.
