# Phase 10 - Scroll- und Saved-Record-Stabilisierung

Phase 10 behebt zwei kritische UX-Regressions:

1. Gespeicherte Eintraege konnten auf Desktop nach Eingaben teilweise nicht mehr zuverlaessig angewaehlt werden.
2. Mobile Scroll-Spruenge wurden durch konkurrierende globale und aktionsbezogene Scroll-Restaurierungen weiter provoziert.

## Ursache

Der relevante Ablauf war:

- Nutzer editiert ein Eingabefeld.
- Nutzer klickt direkt auf einen gespeicherten Eintrag.
- Das Eingabefeld verliert Fokus und plant einen Re-Render.
- Der Re-Render kann vor dem eigentlichen Click laufen.
- Der urspruenglich geklickte DOM-Knoten wird ersetzt; der Click-Handler laeuft nicht mehr oder konkurriert mit einer zweiten Scroll-Restaurierung.

Zusätzlich hat `bindNoClickScroll` auch interaktive Elemente wie gespeicherte Karten global stabilisiert. Diese globale Stabilisierung lief parallel zu den gezielten Saved-Record-Scroll-Transaktionen.

## Aenderungen

- Neuer zentraler Interaction Guard in `renderer.js`.
- Pointer-/Mouse-/Touchstart auf Buttons und Saved Cards markieren eine committed action vor dem Blur-Re-Render.
- `bindCommonInputs` unterdrueckt dadurch kurzzeitig den Blur-basierten Re-Render, damit der Click nicht verloren geht.
- Globale Click-Scroll-Restaurierung ignoriert interaktive Elemente jetzt bewusst.
- `bindSavedRecordList` erlaubt `preserveLoadScroll: false`, damit zentrale Controller keine doppelte Scroll-Transaktion ausloesen.
- `savedCalculationController` nutzt nur noch eine gezielte Saved-Record-Scroll-Transaktion.
- Scroll-Presets erzwingen kein `blur()` mehr.
- Regressionstest `tests/saved-record-interaction.test.mjs` wurde ins Quality Gate aufgenommen.

## Erwartetes Verhalten

- Gespeicherte Eintraege sind auf Desktop wieder per Klick ladbar und bearbeitbar.
- Klicks auf gespeicherte Karten loesen keinen vorgezogenen Blur-Render mehr aus.
- Mobile Ansicht vermeidet konkurrierende Rueckspruenge nach gespeicherten Aktionen.
- Scroll-Handling ist weniger aggressiv und zentraler kontrolliert.

## Hinweis

Die verbleibende Ursache fuer weitere Scroll-Artefakte waere dann nicht mehr der Click-Verlust, sondern modulweiser Full-Render mit stark wechselnder Content-Hoehe. Diese Faelle muessen in der naechsten Konsolidierung ueber granularere Section-Updates reduziert werden.
