# QM-008 Browser Compatibility

Status: verbindlich ab Version 1.3.3-dev.7

## Zielbrowser

- Chrome Desktop
- Edge Desktop
- Firefox Desktop
- Safari/iOS WebKit
- Windows PWA
- iOS/iPadOS PWA

## Konsolenstandard

Vor RC gilt:

- 0 ungeklärte JavaScript Runtime Errors,
- 0 ungeklärte TypeErrors,
- 0 ungeklärte ReferenceErrors,
- 0 ungeklärte unhandled Promise Rejections,
- Browser-/Extension-Hinweise sind zulässig, wenn sie dokumentiert und nicht app-kritisch sind.

## CSP und Meta

CSP-Regeln müssen explizit genug sein, um Browserwarnungen nachvollziehbar zu machen. Deprecated Meta-Tags sind zu entfernen, wenn moderne Manifest-/PWA-Mechanismen dieselbe Aufgabe übernehmen.
