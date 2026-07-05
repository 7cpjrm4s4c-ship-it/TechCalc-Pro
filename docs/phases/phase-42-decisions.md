# Phase 42A – Decisions

Version basis: `1.3.2-dev.36`
Status: documentation/audit-only baseline

## Entscheidung 1 – Keine neue Architektur vor 42B

Phase 42A bestaetigt: Es existieren bereits zentrale Vertrage fuer Module, Saved Records, Scroll, Event-Pipeline und UI. Neue Regeln werden nicht eingefuehrt, bevor 42B die vorhandenen Vertrage geordnet hat.

## Entscheidung 2 – Legacy wird entfernt, nicht ueberbaut

Weitere CSS-Hotfixdateien, additive Stability-Dateien, neue Wrapper oder weitere modulbezogene Guards sind nicht zulässig, solange ein bestehender Vertrag verletzt wird.

## Entscheidung 3 – Referenzmodule

Save/Edit/Selection-Referenz:

- `heating-cooling`
- `pressure-holding`

Diagramm-/Outlet-Sonderfall:

- `hx-diagram`

## Entscheidung 4 – h,x rows-only ist kein finaler Vertrag

Rows-only bei Saved-Aktionen ist nur ein Isolationsergebnis. Der finale Vertrag muss fachlich korrekt bleiben:

- gespeicherten Prozess laden
- Inputs hydratisieren
- Save/Edit-Zustand synchronisieren
- Saved-Card markieren
- Prozessauswahl aktualisieren
- Ergebnisblock aktualisieren
- Diagramm aktualisieren

Gleichzeitig darf dies keinen Scrollsprung ausloesen.

## Entscheidung 5 – Scroll-Stabilitaet liegt zentral

Lokale Scroll-Fixes in Modulen sind Legacy. Ziel ist zentrale Stabilitaet ueber:

- stabile Action-Transaktionen
- stabile Anchors
- begrenzte Dynamic-Updates
- keine vollstaendigen Rebuilds nicht betroffener Inseln
- kein lokales `scrollTo`/Restore pro Modul

## Entscheidung 6 – Regenwasser wird nicht als generisches Muster verwendet

Regenwasser enthaelt historisch notwendige Capture-/Precommit-Sonderlogik. Diese ist zu pruefen und ggf. zu konsolidieren, aber sie ist kein Muster fuer andere Module.

## Entscheidung 7 – Phase-42-Dokumente liegen unter `docs/phases`

Phase-42-Ergebnisse werden nicht als neue lose Root- oder Unterordnernotizen abgelegt. Zusammenfassung, Audit, Entscheidungen und Checkliste werden unter `docs/phases/` gepflegt.

