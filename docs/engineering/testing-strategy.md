# Testing Strategy

## Testebenen

### Fast Gate

```bash
npm test
```

Schnelle statische und strukturelle Pruefungen. Muss vor jedem Commit laufen, wenn Code betroffen ist.

### Integration Gate

```bash
npm run test:integration
```

Prueft Architekturvertraege, zentrale Audits und projektweite Regressionen.

### Build Gate

```bash
npm run build
```

Synchronisiert Precache/Service Worker und prueft Imports.

### E2E / Manuell

```bash
npm run test:e2e
```

Oder gezielte manuelle Pruefung auf Zielgeraeten. Erforderlich bei PWA, Keyboard, Mobile Input, Theme, PDF und Layout.

## Prinzip

Tests pruefen nicht nur, ob Code syntaktisch laeuft, sondern ob die zentralen Contracts weiterhin eingehalten werden.
