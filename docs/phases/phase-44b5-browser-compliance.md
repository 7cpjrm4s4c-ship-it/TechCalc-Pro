# Phase 44B.5 – Browser Compliance

## Analyse

Die ausgeklappte Edge-/Chromium-Konsole zeigte keine JavaScript-Runtime-Fehler. Die roten Einträge stammten aus der Browser-Compliance-Ebene:

- Netlify Preview/Toolbar wurde durch die CSP geblockt, weil `frame-src` nicht explizit gesetzt war und dadurch auf `default-src 'self'` zurückfiel.
- Chromium fordert bei vorhandenem Apple-Standalone-Meta-Tag zusätzlich `mobile-web-app-capable` an. Beide Einträge bleiben als Kompatibilitätshinweise erhalten; das Manifest definiert den Standalone-Modus.

## Design Review

Referenz ist eine PWA-Konsole ohne ungeklärte JavaScript-Exceptions, TypeErrors, ReferenceErrors oder unhandled Promise Rejections. Browser-/Security-Warnungen werden nicht ignoriert, sondern über explizite Verträge abgesichert.

Security-Zielbild:

- restriktive Default-CSP bleibt erhalten,
- Netlify Preview/Toolbar wird durch `frame-src 'none'` und `child-src 'none'` blockiert; die Vorschauleiste wird bei Bedarf in Netlify deaktiviert,
- `frame-ancestors 'none'` bleibt bestehen,
- PWA-Standalone wird über das Manifest gesteuert; Apple- und Chromium-Meta-Tags ergänzen die Kompatibilität,
- der Audit prüft die beiden Kompatibilitätshinweise sowie den Standalone-Modus im Manifest.

## Implementierung

- `_headers`: CSP um `frame-src 'none'` und `child-src 'none'` ergänzt.
- `index.html`: `mobile-web-app-capable` und `apple-mobile-web-app-capable` sind jeweils mit `content="yes"` vorhanden.
- `scripts/audit-browser-compliance-phase44b5.mjs`: Browser-Compliance-Audit ergänzt.
- `package.json`: Audit in `lint` eingebunden.

## Regression

Auszuführen vor Gate-10-Abschluss:

```bash
npm ci
npm run lint
npm test
npm run test:integration
npm run build
```

Zusätzlich manuelle Browser-Kontrolle:

- Chrome Desktop
- Edge Desktop
- Firefox Desktop
- iOS Safari/PWA Installationsmodus
- Windows Desktop PWA

Akzeptanzkriterium: keine ungeklärten roten JavaScript-Fehler; CSP-/PWA-Hinweise müssen entweder beseitigt oder bewusst dokumentiert sein.

## Dokumentation

Phase 44B.5 ergänzt Gate 10 um den letzten Browser-Compliance-Schritt vor RC-Freigabe. Der neue Standard für zukünftige Phasen lautet:

1. Analyse – bestehende Dokumentation und Verträge prüfen.
2. Design Review – Zielbild und Referenz festlegen.
3. Implementierung – kleine, nachvollziehbare Änderungen.
4. Regression – gezielte Tests gegen Referenzmodule.
5. Dokumentation – Contracts, ADRs und Phasendokumente aktualisieren.


## Security Header Hardening

- `Cross-Origin-Opener-Policy: same-origin` und `Cross-Origin-Resource-Policy: same-origin` sind Teil des Browser-Compliance-Vertrags.
- Externe Frame-Quellen sind nicht Bestandteil des aktuellen Laufzeitvertrags; CSP verwendet `frame-src 'none'` und `child-src 'none'`.
