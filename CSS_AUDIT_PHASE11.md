# CSS Audit – Phase 11

Der zentrale UI-Vertrag liegt weiterhin in `style.css`. `layout.css` bleibt PDF/Legacy-Schicht und sollte nicht mehr für App-UI erweitert werden.

## Nächste risikoarme Schritte
- Inline-Styles in `index.html` weiter reduzieren.
- Modul-spezifische Altklassen schrittweise auf `tcp-*` umstellen.
- PDF-spezifische Regeln endgültig aus App-UI-Dateien entfernen.
