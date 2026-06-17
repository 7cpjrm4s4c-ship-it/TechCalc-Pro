# Phase 32D – Loading Performance & Release Notes Hardening

## Ziel

Zwei offene RC-Themen wurden behandelt:

- Module sollen beim Wechsel schneller wirken und den Hinweis „Modul wird geladen...“ nicht mehr bei schnellen Mounts anzeigen.
- Release Notes sollen im Einstellungsmenü wieder zuverlässig geladen werden.

## Änderungen

### Modul-Ladeverhalten

- Lazy Module werden nach App-Start im Idle-Fenster vorgeladen.
- Das aktuell geroutete Modul wird sofort vorgeladen.
- Der globale Ladehinweis wird verzögert angezeigt und entfällt bei schnellen Mounts.
- Das Timeout- und Fehlerverhalten des ModuleRuntime bleibt unverändert.

### Release Notes

- Der Parser akzeptiert jetzt auch die Root-Überschrift `# TechCalc Pro 1.3.0`.
- Der dynamische Fetch nutzt den versionsgebundenen Pfad ohne Zeitstempel-Busting, damit Service-Worker und Hosting-Caches stabil arbeiten.
- Der bestehende Fallback bleibt erhalten.

## Tests

- `test:phase32d` ergänzt.
- Quality Gate erweitert.
