# Code Review Checklist

## Allgemein

- [ ] Scope ist klar und begrenzt.
- [ ] Keine fachfremden Aenderungen im selben Patch.
- [ ] Keine neuen parallelen Architekturvertraege.
- [ ] Bestehende Contracts wurden beruecksichtigt.
- [ ] Neue Ausnahmen sind dokumentiert.

## Architektur

- [ ] Save/Edit/Selection nutzt den zentralen Vertrag.
- [ ] Keyboard/Focus nutzt den zentralen Vertrag.
- [ ] Scroll-Verhalten nutzt zentrale Stabilitaetsmechanismen.
- [ ] Module fuehren keine eigene Infrastruktur fuer Querschnittsthemen ein.
- [ ] h,x-Sonderfall bleibt auf Render-Outlets begrenzt.

## UI/CSS

- [ ] Keine neue CSS-Hotfixdatei.
- [ ] Keine doppelten Regeln in Light/Dark/System.
- [ ] Modulfarben laufen ueber Tokens.
- [ ] Globale UI-Buttons verwenden keine Modulfarben.

## Tests

- [ ] `npm test` gruen.
- [ ] `npm run test:integration` gruen.
- [ ] `npm run build` gruen.
- [ ] Manuelle Regression ist beschrieben, wenn erforderlich.
