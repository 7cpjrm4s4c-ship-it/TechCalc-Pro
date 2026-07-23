# Phase 47D – Regression und Plattformfreigabe

## Status

**Abgeschlossen und freigegeben am 23.07.2026.**

Die fachlichen, technischen, plattformbezogenen und manuellen Nachweise wurden vollständig erbracht. Der Anwender hat alle zuvor offenen manuellen Checks ausdrücklich als bestanden freigegeben.

## Konsolidiertes automatisiertes Gate

```bash
npm run build:verify:phase47d
```

Das Gate umfasst:

1. statische Architektur-, Security-, Accessibility- und Browser-Audits,
2. modulübergreifende Regression,
3. vollständige Phase-47C-Fach- und Modulregression,
4. Integrationsprüfungen,
5. reproduzierbaren Build,
6. Playwright-E2E-Matrix.

Der GitHub-Actions-Workflow `Playwright Tests` Run #193 wurde auf Head `ab4c805a65931031d25a0cd32123baafeca85f59` erfolgreich abgeschlossen. Damit sind Lint, Audits, Unit-, Fach-, Integrations-, Build- und E2E-Gates automatisiert nachgewiesen.

## Automatisierte Browser- und Viewportmatrix

| Playwright-Projekt | Engine | Zielklasse | Status |
| --- | --- | --- | --- |
| `chromium-desktop` | Chromium | Desktop / Chrome-Basis | bestanden |
| `firefox-desktop` | Firefox | Desktop / Firefox | bestanden |
| `chromium-tablet` | Chromium | Android-Tablet | bestanden |
| `chromium-mobile` | Chromium | Android-Smartphone | bestanden |
| `webkit-tablet` | WebKit | iPad-Klasse | bestanden |
| `webkit-mobile` | WebKit | iPhone-Klasse | bestanden |

## Regressionsmatrix

| Prüfbereich | Evidenz | Freigabestatus |
| --- | --- | --- |
| Fachberechnung und Referenzfälle | Phase-47C-Fachtests und manuelle Gegenprüfung | bestanden |
| Save/Edit/Load und Dirty-State | Lifecycle-, Storage- und E2E-Tests | bestanden |
| Projektimport und -export | Storage-, Integrations- und reale Projektdateiprüfung | bestanden |
| Migration älterer Projekte | Legacy- und Migrationsprüfungen | bestanden |
| PDF und Mehrseitigkeit | Authority-PDF-, Pagination-, TOC-, Diagramm- und visuelle Exportprüfung | bestanden |
| PDF ohne DWA | bedingter DWA-Scope und visueller Referenzexport | bestanden |
| Light/Dark/System | Theme-Audits und manuelle Sichtprüfung | bestanden |
| Smartphone, Tablet, Desktop | sechs Playwright-Projekte und reale Geräteprüfung | bestanden |
| iOS/iPadOS/macOS/Windows | Engine-Nachweise und manuelle Plattformfreigabe | bestanden |
| Chrome, Edge, Firefox, Safari | automatisierte und manuelle Browserprüfung | bestanden |
| Offlinebetrieb und Cachewechsel | Service-Worker-, Offline-, Precache- und Update-Flow-Prüfung | bestanden |
| Accessibility und Keyboard Navigation | Accessibility-, Fokus-, Keyboard- und Touchprüfung | bestanden |
| Bestehende Regression aller Module | Unit, Integration, Build, E2E und Modul-Smoke-Test | bestanden |

## PDF-Scope-Regel

Der DWA-A-117-Nachweis ist im Behörden-PDF ausschließlich enthalten, wenn `hydraulics.dischargeMode` den Wert `authority-discharge-limit` trägt. Ohne behördliche Einleitungsbeschränkung entfallen die DWA-spezifischen Kapitel, Tabellen, Kennzahlen, Diagramme und Quellen. Der DIN-1986-100-Nachweis bleibt vollständig erhalten; die Kapitelnummerierung bleibt lückenlos.

## Manuelle Plattformmatrix

| Betriebssystem | Browser | Formfaktor | Status |
| --- | --- | --- | --- |
| iOS | Safari | Smartphone | bestanden |
| iPadOS | Safari | Tablet | bestanden |
| macOS | Safari, Chrome, Firefox | Desktop | bestanden |
| Windows | Edge, Chrome, Firefox | Desktop | bestanden |

Geprüft wurden Modulstart, Eingabe, Berechnung, Save/Edit/Load, PDF-Export, Themewechsel, Keyboard- beziehungsweise Touchbedienung und Offline-/Reload-Szenario.

## Exit-Kriterien

- [x] konsolidiertes automatisiertes Gate erfolgreich
- [x] Desktop-/Tablet-Teilgate erfolgreich
- [x] fachliche Referenzfälle bestanden
- [x] finaler PDF-Export visuell bestätigt
- [x] PDF ohne DWA visuell bestätigt
- [x] reale Plattformmatrix abgeschlossen
- [x] Offline-, Cache- und Updateverhalten bestanden
- [x] keine Regression bestehender Module
- [x] keine offenen blockierenden Befunde

## Finaler Freigabestatus

**GO – Phase 47D ist abgeschlossen. Die vollständige Phase 47 ist zum Merge freigegeben.**
