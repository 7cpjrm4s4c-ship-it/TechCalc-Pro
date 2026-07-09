# QM-011 Accessibility

Status: verbindlich ab Version 1.3.4-dev.3 / Phase 46C

## Zielniveau

TechCalc Pro verwendet ab Phase 46C **WCAG 2.1 AA** als verbindliches Zielniveau für UI- und PWA-Weiterentwicklungen.

Der Standard ist als produktinterner Qualitätsmaßstab definiert. Eine externe Zertifizierung wird dadurch nicht behauptet.

## Mindeststandard

- Tastaturbedienung über relevante Inputs und Aktionen.
- Enter-/Tab-Navigation konsistent nach Keyboard Contract.
- Fokuszustände sichtbar und stabil.
- Mobile Inputs dürfen keine unerwünschten Zoom-/Scroll-Effekte auslösen.
- Light/Dark/System-Themes müssen ausreichenden Kontrast und konsistente Lesbarkeit bieten.
- Interaktive Elemente benötigen einen zugänglichen Namen über sichtbaren Text, `aria-label` oder `aria-labelledby`.
- Statusmeldungen für Projekt-, Feedback- und Systemzustände verwenden `aria-live="polite"`.
- Bilder benötigen ein `alt`-Attribut; rein dekorative Bilder verwenden `alt=""`.
- Dynamische Modulwechsel setzen den Fokus kontrolliert auf den App-Hauptbereich.

## Automatisierte Prüfung

Phase 46C ergänzt `scripts/audit-accessibility-phase46c.mjs` und bindet den Audit in `npm run lint` ein.

Der Audit prüft statisch:

- Sprachdeklaration und Viewport.
- Fokusfähigen App-Hauptbereich.
- ARIA-Basis für Navigation, Einstellungen, Theme-Auswahl und Statusmeldungen.
- `alt`-Attribute für Bilder.
- zugängliche Namen für statische Buttons.
- Labels oder ARIA-Namen für statische Inputs.
- Vorhandensein dieser QM-Referenz und der Phase-46C-Dokumentation.

## Manuelle Regression

Für Release Candidates bleiben zusätzlich manuelle Prüfungen erforderlich:

- vollständige Tastaturbedienung ohne Maus,
- sichtbarer Fokus auf Desktop und mobiler PWA,
- Screenreader-Smoke-Test für Navigation, Einstellungen und Ergebnisbereiche,
- Kontrastprüfung in Light, Dark und System,
- mobile Eingabefelder ohne unerwünschten Zoom.

## Grenzen

Der Phase-46C-Audit ersetzt keine vollständige WCAG-Zertifizierung und keine browserbasierte Prüfung mit Screenreader oder axe-core. Er verhindert jedoch, dass zentrale Accessibility-Basisverträge unbemerkt aus der Codebasis verschwinden.

## Referenzen

- `docs/contracts/keyboard-contract.md`
- `docs/contracts/theme-contract.md`
- `docs/contracts/render-contract.md`
- `scripts/audit-accessibility-phase46c.mjs`
