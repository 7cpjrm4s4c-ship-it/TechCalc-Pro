# Phase 47D – Regression und Plattformfreigabe

## Ziel

Phase 47D führt die fachlichen, technischen und plattformbezogenen Nachweise für den Überflutungsnachweis sowie die vollständige bestehende TechCalc-Pro-Plattform in einem reproduzierbaren Quality Gate zusammen.

Eine Prüfung gilt nur dann als bestanden, wenn eine ausführbare Testevidenz oder ein dokumentierter manueller Prüfbeleg vorliegt. Aus Konfiguration, Quellcode oder erwarteter Browserkompatibilität wird kein bestandener Status abgeleitet.

## Konsolidiertes automatisiertes Gate

```bash
npm run build:verify:phase47d
```

Das Gate führt in dieser Reihenfolge aus:

1. statische Architektur-, Security-, Accessibility- und Browser-Audits,
2. bestehende modulübergreifende Regression,
3. vollständige Phase-47C-Fach- und Modulregression,
4. Integrationsprüfungen,
5. reproduzierbaren Build,
6. Playwright-E2E-Matrix.

## Automatisierte Browser- und Viewportmatrix

| Playwright-Projekt | Engine | Zielklasse | Status |
| --- | --- | --- | --- |
| `chromium-desktop` | Chromium | Desktop / Chrome-Basis | konfiguriert, Ausführung erforderlich |
| `firefox-desktop` | Firefox | Desktop / Firefox | konfiguriert, Ausführung erforderlich |
| `chromium-tablet` | Chromium | Android-Tablet | konfiguriert, Ausführung erforderlich |
| `chromium-mobile` | Chromium | Android-Smartphone | konfiguriert, Ausführung erforderlich |
| `webkit-tablet` | WebKit | iPad-Klasse | konfiguriert, Ausführung erforderlich |
| `webkit-mobile` | WebKit | iPhone-Klasse | konfiguriert, Ausführung erforderlich |

Playwright-WebKit ist ein automatisierter Engine-Nachweis, ersetzt aber keinen abschließenden Test auf realem iOS/iPadOS/macOS Safari.

## Regressionsmatrix

| Prüfbereich | Automatisierte Evidenz | Ergänzende manuelle Evidenz | Freigabestatus |
| --- | --- | --- | --- |
| Fachberechnung und definierte Referenzfälle | Phase-47C-Fachtests, DIN-/DWA-Dauerstufen- und kombinierte Speichertests | fachliche Gegenrechnung der freigegebenen Referenzfälle | offen bis Gate und Gegenrechnung protokolliert sind |
| Save/Edit/Load und Dirty-State | Saved-Record-, Lifecycle-, Projekt-Storage- und Modulzustandstests | Interaktionsprüfung im Deploy Preview | offen |
| Projektimport und -export | Projektdateiformat-, Storage- und Integrationsprüfungen | Import/Export einer realen `.tcproj`-Datei | offen |
| Migration älterer Projekte | Legacy-Saved-Records- und Projektmigrationsprüfungen | Stichprobe mit archiviertem Projektstand | offen |
| PDF und Mehrseitigkeit | Authority-PDF-, Pagination-, TOC-, Diagramm- und PDF-Serialisierungstests | visueller Referenzexport über fünf Seiten | Referenzexport 47C.12F akzeptiert; erneute Prüfung nach finalem Head erforderlich |
| Light/Dark/System | Theme-Audits und visuelle Flooding-E2E-Prüfungen | Sichtprüfung der drei Modi | offen |
| Smartphone, Tablet, Desktop | sechs Playwright-Projekte | reale Touch- und Desktopgeräte | offen |
| iOS/iPadOS/macOS/Windows | WebKit-/Chromium-/Firefox-Engine-Nachweise | reale Geräte und Betriebssysteme | manuell offen |
| Chrome, Edge, Firefox, Safari | Chromium, Firefox und WebKit | Edge und reale Safari-Versionen | teilweise automatisiert, manuell offen |
| Offlinebetrieb und Cachewechsel | Service-Worker-, Offline-, Precache- und Update-Flow-Tests | installierte PWA mit Versionswechsel | offen |
| Accessibility und Keyboard Navigation | Accessibility-, DOM-Sink-, Browser- und Keyboard-Audits | Screenreader-, Fokus- und Touchprüfung | offen |
| Bestehende Regression aller Module | `npm test`, Integration und Build | Smoke-Test der Hauptmodule | offen |

## Manuelle Plattformmatrix

Für den Abschluss sind mindestens folgende reale Kombinationen zu protokollieren:

| Betriebssystem | Browser | Formfaktor |
| --- | --- | --- |
| iOS | Safari | Smartphone |
| iPadOS | Safari | Tablet |
| macOS | Safari, Chrome, Firefox | Desktop |
| Windows | Edge, Chrome, Firefox | Desktop |

Je Kombination sind mindestens Modulstart, Eingabe, Berechnung, Save/Edit/Load, PDF-Export, Themewechsel, Keyboard- beziehungsweise Touchbedienung und ein Offline-/Reload-Szenario zu prüfen.

## Exit-Kriterien

Phase 47D ist abgeschlossen, wenn:

- `npm run build:verify:phase47d` erfolgreich ausgeführt und protokolliert wurde,
- alle fachlichen Referenzfälle mit Sollwerten bestanden sind,
- der finale PDF-Export nach dem letzten Head visuell bestätigt wurde,
- die reale Plattformmatrix ohne kritische oder hohe Befunde abgeschlossen ist,
- Offline-, Cache- und Updateverhalten dokumentiert bestanden sind,
- keine Regression in bestehenden Modulen vorliegt,
- offene mittlere oder niedrige Befunde mit Risiko, Verantwortlichkeit und Folgetermin dokumentiert sind.

## Aktueller Status

Die konsolidierte Teststruktur und die erweiterte automatisierte Browsermatrix sind implementiert. Eine vollständige 47D-Freigabe ist noch nicht erteilt, da die Ausführung des Gesamt-Gates und die reale Geräte-/OS-Matrix als Evidenz ausstehen.
