# Phase 47C.8.2G – Visual Regression Gate

## Ziel

Die Ergebnisdarstellung des Moduls `flooding-verification` wird auf Desktop, Tablet und Smartphone gegen Layoutüberläufe, abgeschnittene Inhalte und überlappende Ergebniszellen geprüft.

## Testmatrix

Playwright-Projekte:

- Chromium Desktop
- WebKit iPad Pro 11
- WebKit iPhone 13

Themes:

- Dark
- Light
- System

## Geometrische Prüfungen

Das Gate prüft im realen Browser-DOM:

- keinen horizontalen Dokument- oder Modulüberlauf,
- keine horizontal überlaufenden Cards, Card-Inhalte, Ergebnisgruppen oder Ergebniszeilen,
- keine vertikal abgeschnittenen Inhalte in Containern mit `overflow-y: hidden`,
- keine Überlagerung zwischen Label- und Wertspalte,
- keine Card-Inhalte außerhalb der horizontalen Card-Grenzen.

Screenshots, Traces und Videos werden nur bei Fehlern als Diagnoseartefakte erzeugt. Pixelbasierte Baselines werden bewusst nicht verwendet, da sie ohne vollständig kontrollierte Font- und Rendering-Umgebung zu instabilen Fehlalarmen führen würden.

## Befehle

```bash
npm run test:visual:flooding
npm run test:e2e
npm run test:flooding
```

`test:flooding` enthält einen schnellen statischen Contract-Test, der die Testmatrix, Theme-Abdeckung und Geometrieprüfungen absichert. Der reale Browserlauf erfolgt über `test:visual:flooding` beziehungsweise das vollständige E2E-Gate.

## Abnahmekriterien

- Desktop, Tablet und Smartphone sind im Playwright-Projektregister enthalten.
- Dark, Light und System werden geprüft.
- Keine Layoutüberläufe oder überlappenden Ergebniszellen.
- Keine abgeschnittenen Inhalte.
- Fehler erzeugen reproduzierbare Screenshot-, Trace- und Videoartefakte.
- Das schnelle Modul-Gate verhindert das unbeabsichtigte Entfernen des Visual Contracts.
