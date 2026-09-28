# Barrierefreiheit: technischer Prüfstand für TechCalc Pro 2.0.0

Zielmaßstab: WCAG 2.1 AA gemäß `docs/qm/QM-011-Accessibility.md`.
Eine WCAG-Konformität oder externe Zertifizierung wird hier nicht festgestellt.

## Durchgeführte technische Prüfung

- Die 15 Module wurden im Netlify-Preview von PR #28 im initialen Zustand
  auf sichtbare Eingaben ohne Beschriftung und doppelte IDs kontrolliert;
  dabei wurde kein solcher Befund festgestellt.
- Die zusätzlichen Browserprüfungen in
  `tests/e2e/module-accessibility-matrix.spec.mjs` prüfen nach CI-Lauf alle
  Module auf zugängliche Namen sichtbarer Bedienelemente, Bildalternativen,
  benannte Gruppen, eindeutige IDs und gültige ARIA-Bezüge.
- Die Tastaturführung im Einstellungsdialog und die Auswahl per Tastatur sind
  mit `tests/e2e/accessibility-review.spec.mjs` abgesichert.
- Repräsentative Eingabemasken werden bei 320 CSS-Pixeln auf abgeschnittene
  Eingabeelemente und Seitenüberlauf geprüft. Diese automatische Prüfung
  erfasst nicht sämtliche Zoom- und Betriebssystemkonfigurationen.
- Primäre Ergebniswerte werden als Statusmeldung ausgezeichnet; der
  Vorzeichenschalter ist in die Tastaturreihenfolge aufgenommen.

## Noch erforderliche manuelle Prüfung

Vor einer vollständigen WCAG-2.1-AA-Konformitätsaussage fehlen eine fachkundige
Tastatur- und Screenreader-Prüfung (VoiceOver und NVDA), eine Messung der
Kontraste über Verläufe und transparente Flächen in allen Themes, die Kontrolle
aller Module bei 200–400 % Zoom sowie Tests von Fehler-, Import-, Export- und
Speicherzuständen. Diese Prüfungen können durch die hier verfügbaren
Quellcode- und Browserprüfungen nicht ersetzt werden.

Normbezug: WCAG 2.1, insbesondere Erfolgskriterien 1.4.3, 1.4.10, 2.1.1,
4.1.2 und 4.1.3. Quelle: https://www.w3.org/TR/WCAG21/
