# Branch Strategy

## Branches

- `main`
  - produktionsfaehiger Stand
  - nur stabile Releases oder Hotfix-Merges

- `develop`
  - Integrationszweig fuer laufende Entwicklung
  - muss jederzeit baubar und testbar bleiben

- `feature/<phase>-<topic>`
  - einzelne Phasen oder Arbeitspakete
  - Beispiel: `feature/phase43a-engineering-standards`

- `release/<version>`
  - Release-Candidate- und Freigabephase
  - Beispiel: `release/1.3.2`

- `hotfix/<topic>`
  - nur fuer produktionskritische Korrekturen auf Basis von `main`

## Merge-Regeln

Vor Merge nach `develop`:

1. Scope ist dokumentiert.
2. Diffs sind reviewbar.
3. Tests laufen gruen.
4. Relevante Dokumentation ist aktualisiert.

Vor Merge nach `main`:

1. Release-Checkliste erfuellt.
2. RC-Regression abgeschlossen.
3. Versionierung, Service Worker und Precache sind synchron.
4. Release Notes sind aktualisiert.
