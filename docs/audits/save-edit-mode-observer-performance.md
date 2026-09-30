# Save/edit observer: Rückkopplung vermeiden

Die zentrale Synchronisierung in `core/ux/saveEditModeSync.js` überwacht
unter anderem `class`, `disabled` und `aria-disabled`. Wiederholte Schreibzugriffe
auf diese Attribute konnten weitere Observer-Aufrufe und damit neue
Animationsframes auslösen, obwohl der fachliche Zustand unverändert war.

Die Synchronisierung vergleicht jetzt sämtliche von ihr geschriebenen Zustände
vor dem Schreiben. Beobachtung und Bündelung über requestAnimationFrame bleiben
erhalten; Datensatzauswahl und Speicheraktionen verwenden dieselbe Logik.

`tests/e2e/save-edit-mode-idle.spec.mjs` prüft mit einem echten MutationObserver
den Erstellmodus, die Auswahl eines Datensatzes, die Rückkehr zum Erstellmodus
und ausbleibende Mutationen nach dem Einschwingen sowie bei wiederholter
Synchronisierung. Der Test läuft über die vorhandenen Browserprojekte.

Lokal bestanden: Lint, npm test, Build und Precache-Prüfung.
Der Browsertest konnte in der aktuellen Umgebung wegen fehlender
Playwright-Browserprogramme nicht starten. Eine Energieeinsparung in Safari
ist noch durch eine erneute Timeline-Messung zu bestätigen.
