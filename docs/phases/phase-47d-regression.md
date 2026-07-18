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

## Desktop-/Tablet-Teilgate

```bash
npm run test:e2e:desktop-tablet
```

Das Teilgate läuft ausschließlich in:

- `chromium-desktop`,
- `firefox-desktop`,
- `chromium-tablet`,
- `webkit-tablet`.

Geprüft werden:

- Start mit dem obersten Modul der gespeicherten Moduleinstellungen,
- vollständiger Scroll-Reset beim Modulwechsel,
- Schließen aller Cards beim Beenden des Hauptmenüs,
- nativer Verlassen-Hinweis nach einer fachlichen Eingabe,
- horizontal überlauffreie Darstellung auf Desktop und Tablet.

Der Test `tests/e2e/phase47d-desktop-tablet-regression.spec.mjs` ist die automatisierte Evidenz. Reale Windows-, macOS- und iPadOS-Geräte bleiben ergänzend erforderlich.

## Automatisierte Browser- und Viewportmatrix

| Playwright-Projekt | Engine | Zielklasse | Status |
| --- | --- | --- | --- |
| `chromium-desktop` | Chromium | Desktop / Chrome-Basis | Desktop-/Tablet-Teilgate eingerichtet, Ausführung erforderlich |
| `firefox-desktop` | Firefox | Desktop / Firefox | Desktop-/Tablet-Teilgate eingerichtet, Ausführung erforderlich |
| `chromium-tablet` | Chromium | Android-Tablet | Desktop-/Tablet-Teilgate eingerichtet, Ausführung erforderlich |
| `chromium-mobile` | Chromium | Android-Smartphone | konfiguriert, Ausführung erforderlich |
| `webkit-tablet` | WebKit | iPad-Klasse | Desktop-/Tablet-Teilgate eingerichtet, Ausführung erforderlich |
| `webkit-mobile` | WebKit | iPhone-Klasse | konfiguriert, Ausführung erforderlich |

Playwright-WebKit ist ein automatisierter Engine-Nachweis, ersetzt aber keinen abschließenden Test auf realem iOS/iPadOS/macOS Safari.

## Regressionsmatrix

| Prüfbereich | Automatisierte Evidenz | Ergänzende manuelle Evidenz | Freigabestatus |
| --- | --- | --- | --- |
| Fachberechnung und definierte Referenzfälle | Phase-47C-Fachtests, DIN-/DWA-Dauerstufen- und kombinierte Speichertests | fachliche Gegenrechnung der freigegebenen Referenzfälle | offen bis Gate und Gegenrechnung protokolliert sind |
| Save/Edit/Load und Dirty-State | Saved-Record-, Lifecycle-, Projekt-Storage-, Modulzustands- und Desktop-/Tablet-E2E-Tests | Interaktionsprüfung im Deploy Preview | offen bis Teilgate ausgeführt ist |
| Projektimport und -export | Projektdateiformat-, Storage- und Integrationsprüfungen | Import/Export einer realen `.tcproj`-Datei | offen |
| Migration älterer Projekte | Legacy-Saved-Records- und Projektmigrationsprüfungen | Stichprobe mit archiviertem Projektstand | offen |
| PDF und Mehrseitigkeit | Authority-PDF-, Pagination-, TOC-, Diagramm-, Scope- und PDF-Serialisierungstests | visueller Referenzexport über fünf Seiten; zusätzlicher Export ohne DWA bei unbeschränkter Einleitung erforderlich | Referenzexport 47C.12F akzeptiert; bedingter DWA-Export nach finalem Head offen |
| Light/Dark/System | Theme-Audits und visuelle Flooding-E2E-Prüfungen | Sichtprüfung der drei Modi | offen |
| Smartphone, Tablet, Desktop | sechs Playwright-Projekte und dediziertes Desktop-/Tablet-Teilgate | reale Touch- und Desktopgeräte | iOS-Smartphone manuell positiv bestätigt; Desktop-/Tablet-Ausführung offen |
| iOS/iPadOS/macOS/Windows | WebKit-/Chromium-/Firefox-Engine-Nachweise | reale Geräte und Betriebssysteme | iOS manuell durch Anwender bestätigt; iPadOS, macOS und Windows offen |
| Chrome, Edge, Firefox, Safari | Chromium, Firefox und WebKit | Edge und reale Safari-Versionen | iOS Safari manuell positiv bestätigt; übrige reale Browser offen |
| Offlinebetrieb und Cachewechsel | Service-Worker-, Offline-, Precache- und Update-Flow-Tests | installierte PWA mit Versionswechsel | offen |
| Accessibility und Keyboard Navigation | Accessibility-, DOM-Sink-, Browser- und Keyboard-Audits | Screenreader-, Fokus- und Touchprüfung | Touchbedienung auf iOS positiv bestätigt; übrige manuelle Prüfungen offen |
| Bestehende Regression aller Module | `npm test`, Integration und Build | Smoke-Test der Hauptmodule | offen |

## PDF-Scope-Regel

Der DWA-A-117-Nachweis ist im Behörden-PDF ausschließlich enthalten, wenn `hydraulics.dischargeMode` den Wert `authority-discharge-limit` trägt. Ohne behördliche Einleitungsbeschränkung entfallen:

- die behördliche Einleitungsrandbedingung,
- die DWA-A-117-Anwendungs- und Parameterprüfung,
- der DWA-A-117-Dauerstufenvergleich,
- DWA-Zeilen in Ergebniszusammenfassung und Quellen,
- die DWA-Kennzahl in der Zusammenfassung,
- das DWA-Diagramm und der DIN-/DWA-Vergleich.

Der DIN-1986-100-Nachweis und sein Dauerstufendiagramm bleiben vollständig erhalten. Die öffentliche Kapitelnummerierung bleibt lückenlos.

## Manuelle Plattformmatrix

Für den Abschluss sind mindestens folgende reale Kombinationen zu protokollieren:

| Betriebssystem | Browser | Formfaktor | Status |
| --- | --- | --- | --- |
| iOS | Safari | Smartphone | manuell durch Anwender am 18.07.2026 positiv bestätigt; keine Auffälligkeiten gemeldet |
| iPadOS | Safari | Tablet | offen |
| macOS | Safari, Chrome, Firefox | Desktop | offen |
| Windows | Edge, Chrome, Firefox | Desktop | offen |

Je Kombination sind mindestens Modulstart, Eingabe, Berechnung, Save/Edit/Load, PDF-Export, Themewechsel, Keyboard- beziehungsweise Touchbedienung und ein Offline-/Reload-Szenario zu prüfen. Die iOS-Rückmeldung ist eine Anwender-Evidenz; einzelne Unterpunkte, die nicht ausdrücklich protokolliert wurden, werden dadurch nicht automatisch als separat bestanden gewertet.

## Exit-Kriterien

Phase 47D ist abgeschlossen, wenn:

- `npm run build:verify:phase47d` erfolgreich ausgeführt und protokolliert wurde,
- `npm run test:e2e:desktop-tablet` in allen vier Zielprojekten erfolgreich ausgeführt wurde,
- alle fachlichen Referenzfälle mit Sollwerten bestanden sind,
- der finale PDF-Export nach dem letzten Head visuell bestätigt wurde,
- die reale Plattformmatrix ohne kritische oder hohe Befunde abgeschlossen ist,
- Offline-, Cache- und Updateverhalten dokumentiert bestanden sind,
- keine Regression in bestehenden Modulen vorliegt,
- offene mittlere oder niedrige Befunde mit Risiko, Verantwortlichkeit und Folgetermin dokumentiert sind.

## Aktueller Status

Die konsolidierte Teststruktur, die erweiterte automatisierte Browsermatrix, das Desktop-/Tablet-Teilgate und die bedingte DWA-PDF-Ausgabe sind implementiert. Die App wurde auf iOS durch den Anwender ohne Auffälligkeiten bestätigt. Eine vollständige 47D-Freigabe ist noch nicht erteilt, da die tatsächliche Ausführung des Desktop-/Tablet-Teilgates und des Gesamt-Gates, der visuelle PDF-Nachweis für den Fall ohne DWA sowie die übrige reale Geräte-/OS-Matrix als Evidenz ausstehen.
