# Phase 42B – Contract Reconciliation

Version basis: `1.3.2-dev.36-phase42a`
Status: completed
Runtime changes: none

## Scope

42B ordnet die in 42A gefundenen zentralen und Legacy-Vertraege. Ziel ist kein neuer Architekturvertrag, sondern die verbindliche Auslegung der bereits dokumentierten Plattformregeln fuer die anschliessende Legacy-Entfernung in 42C.

Gepruefte Codebereiche:

- `js/core/savedRecordController.js`
- `js/core/savedCalculationController.js`
- `js/core/savedRecords.js`
- `js/platform/lineSectionController/index.js`
- `js/platform/moduleRuntime/index.js`
- `js/core/eventPipeline.js`
- `js/core/scrollManager.js`
- `js/modules/hx-diagram/renderPipeline.js`
- `js/modules/hx-diagram/controller.js`
- `js/modules/rainwater/index.js`
- `js/modules/heat-recovery/dynamicRenderer.js`
- `js/modules/buffer-storage/controller.js`
- `js/modules/ventilation/controller.js`

## Bestehender Zielvertrag

### 1. Saved/Edit/Selection Lebenszyklus

Der verbindliche Ablauf fuer gespeicherte Inhalte lautet:

1. Benutzeraktion ueber zentrale `data-tc-action` oder zentrale Saved-Record-Attribute.
2. Felder werden vor Save/Update bei Bedarf zentral committed.
3. State wird ueber zentrale Reducer-Logik gepatcht.
4. `activeIdKey` bestimmt Edit-Mode und Card-Markierung.
5. Save/Edit-Buttons werden aus `activeIdKey` abgeleitet.
6. Nur betroffene Dynamic-Inseln werden aktualisiert.
7. Es wird kein lokaler Modul-Scroll und kein lokaler Fokus erzwungen.

Dieser Ablauf ist bereits in `savedRecordController`, `savedCalculationController`, `lineSectionController` und `moduleRuntime` angelegt. 42C darf ihn nicht ersetzen, sondern muss Abweichungen entfernen.

### 2. Referenzverhalten

Referenzmodule ohne Diagramm:

- `heating-cooling`
- `pressure-holding`

Akzeptanzkriterien aus diesen Modulen:

- gespeicherter Eintrag laedt Inputs
- aktive Card wird markiert
- Save ist ohne Auswahl aktiv
- Update ist mit Auswahl aktiv
- erneuter Klick deselectet oder fuehrt klar definierten Edit-Mode aus
- kein Modul-spezifischer Scroll-/Focus-Fix ist noetig

### 3. h,x Sondervertrag fuer Ausgabeinseln

`hx-diagram` darf nicht auf rows-only reduziert werden. Der fachlich korrekte Ablauf bei `saved:load`, `saved:delete` und `line:toggle` lautet:

- Inputs/Form-State synchronisieren
- Saved Rows und Controls aktualisieren
- Prozessauswahl aktualisieren, wenn sich die fachliche Verfuegbarkeit geaendert hat
- Ergebnisblock aktualisieren, wenn sich die berechneten Punkte geaendert haben
- Diagramm aktualisieren, wenn sich die dargestellten Punkte geaendert haben

Gleichzeitig gilt:

- keine komplette Module-View neu einsetzen
- keine ganze Ergebnis-/Diagramm-Card per unbedingtem `innerHTML` ersetzen, wenn Inhalt semantisch gleich ist
- keine lokale Scroll-Freeze-Kette
- keine lokale Focus-Korrektur nach Saved-Aktion

Der Zielzustand ist deshalb: differenzielle Outlet-Synchronisierung statt rows-only oder full-rebuild.

### 4. Regenwasser Sonderhistorie

Regenwasser besitzt dokumentierte Precommit-/Hydration-Sonderlogik aus Phase 36W.2D bis 36W.2I. Diese darf nicht blind entfernt werden.

42C muss die Sonderlogik gegen den zentralen Vertrag mappen:

- Was ist notwendiger fachlicher Precommit?
- Was ist Legacy-Bridge?
- Was verursacht Re-Render oder Scrollsprung?

Erst danach darf Code entfernt werden.

## Vertragsabgleich der zentralen Implementierungen

### `savedRecordController` / `savedCalculationController`

Status: zentrale Basis fuer klassische Saved-Record-Workflows.

Stark:

- nutzt `savedRecordReducer`
- kennt `hydrate`, `clear`, `snapshot`
- kann Save/Update/Load/Delete zentral binden

Risiken:

- `bindSavedRecordList` nutzt fruehe `pointerdown`-Aktivierung
- `preserveLoadScroll` ist optional und in dev36 wegen globaler Scrollprobleme effektiv reduziert
- parallele Nutzung mit `registerCentralActions` kann Doppelaktionen erzeugen, wenn ein Modul beide Wege bindet

Ziel fuer 42C:

- Nur ein Action-Weg pro Modul.
- Keine parallele native SavedRecordList-Bindung plus zentrale Action Map fuer dieselben Elemente.

### `lineSectionController`

Status: abgeleiteter zentraler Controller fuer line-/saved-section-artige Module.

Stark:

- rendert Save/Edit-Card zentral
- nutzt `activeIdKey`, `expandedIdKey`, `nameKey`
- bindet `saved:load`, `saved:delete`, `saved:toggle` ueber `registerCentralActions`

Risiken:

- eigene Dedupe-Logik neben Event-Pipeline
- eigene `renderRows`/`renderCard`-Struktur kann mit Modul-Dynamic-Renderern kollidieren
- `preserveSavedRecordMutation` ist in dev36 ein no-op; damit haengt Scroll-Stabilitaet vollstaendig an stabilen DOM-Inseln

Ziel fuer 42C:

- `lineSectionController` bleibt Referenz fuer gespeicherte Listen.
- Module duerfen ihn nicht durch eigene Saved-Handler ergaenzen.
- Dynamic-Renderer duerfen seine Card nicht komplett ersetzen, wenn nur Rows/Selection wechseln.

### `moduleRuntime` Saved-Records

Status: generischer Plattformpfad fuer Module mit `savedConfig`.

Stark:

- integriert Save/Edit/Selection in zentrale Runtime
- setzt Actions konsistent als `line:*`
- nutzt `savedRecordReducer`

Risiken:

- parallel zu `lineSectionController` vorhanden
- dieselben Actions koennen konzeptionell ueber zwei zentrale Pfade existieren

Ziel fuer 42C:

- Pro Modul festlegen: `moduleRuntime.savedConfig` oder expliziter `lineSectionController`, nicht beides.
- Beide Pfade muessen dieselben Action-Namen und State-Semantik liefern.

### `savedRecords.js`

Status: zentrale Darstellung und Aktivierung von Saved Cards.

Stark:

- einheitliches Markup fuer aktive/expandierte Cards
- zentrale Delete/Toggle/Load-Attribute

Risiken:

- `pointerdown` aktiviert bereits vor `click`
- `stopImmediatePropagation()` kann Modul- oder Pipeline-Handler blockieren
- bei parallelen Bindings koennen fruehe Actions und spaete Central Actions auseinanderlaufen

Ziel fuer 42C:

- Fruehaktivierung nur dort behalten, wo sie dokumentiert noetig ist.
- Doppelte Binding-Wege entfernen.

### `scrollManager.js`

Status: zentrale Scroll-Schicht, aber dev36 ist kein finaler Zustand.

Aktueller Befund:

- `preserveSavedRecordScroll()` und `preserveSavedRecordMutation()` fuehren nur `action?.()` aus.
- Gleichzeitig existiert noch `initializeGlobalSavedRecordScrollStability()` mit globalem Restore-Mechanismus.

Bewertung:

- Absolute Restore-Ketten haben in dev30–34 sichtbare Regressionen erzeugt.
- Vollstaendiges Abschalten beseitigt Restore-Artefakte, loest aber Layout-Shifts nur dann, wenn Dynamic-Inseln stabil bleiben.

Ziel fuer 42C:

- Kein Rueckfall auf lange Restore-Ketten.
- Scroll-Stabilitaet primaer ueber stabile DOM-Inseln, stabile Anchors und minimale Updates.
- Globale Restore-Mechanismen nur als eng begrenzter Fallback, nicht als Standardpfad.

## Verbindliche Action-Semantik

| Action | Bedeutung | Muss tun | Darf nicht tun |
|---|---|---|---|
| `line:save` | neuen Datensatz speichern | Liste erweitern, Edit-Mode leer lassen | aktiven Datensatz ueberschreiben |
| `line:update` | aktiven Datensatz aktualisieren | bestehenden Datensatz ersetzen, Active-ID behalten | neuen Datensatz erzeugen |
| `saved:load` / `line:select` | gespeicherten Datensatz laden | Inputs hydratisieren, Active-ID setzen, Ausgaben synchronisieren | ganze Modulansicht neu mounten |
| `line:deselect` | aktive Auswahl aufheben | Active-ID leeren, Name leeren | gespeicherte Liste veraendern |
| `saved:delete` / `line:delete` | Datensatz loeschen | Liste reduzieren, Active-ID leeren falls betroffen | lokale Scroll-/Focus-Ketten starten |
| `saved:toggle` / `line:toggle` | Details ein-/ausklappen | Expanded-ID setzen | Inputs oder Ausgaben veraendern |

## Outlet-Vertrag

42B bestaetigt folgenden bestehenden Zielzustand fuer Dynamic-Renderer:

- Jede dynamische Ausgabe besitzt eine benannte Insel.
- Eine Saved-Aktion aktualisiert nur Inseln, deren Daten sich semantisch geaendert haben.
- Eine Insel darf nicht komplett ersetzt werden, wenn sich nur Klassen wie `is-active` oder Button-States aendern.
- Inputs duerfen nur geschrieben werden, wenn sie nicht aktiv fokussiert sind oder wenn Hydration explizit gewuenscht ist.
- Diagramme duerfen aktualisiert werden, aber nicht durch einen kompletten Neuaufbau oberhalb der Saved-Card, wenn ein diff-basierter Update reicht.

## Legacy-Konfliktklassen fuer 42C

42B markiert folgende Konfliktmuster als Legacy-Kandidaten:

- lokale `scrollTo`, `scrollTop`, `scrollIntoView` nach Saved-Aktionen
- lokale `focus()`-Aufrufe nach Selection/Delete
- direkte `innerHTML`-Rebuilds kompletter Modulbereiche bei Saved-Aktionen
- parallele `pointerdown`- und `click`-Handler fuer dieselbe Saved-Aktion
- lokale Save/Update/Load/Delete-Handler zusaetzlich zu `registerCentralActions`
- lokale Dynamic-Renderer, die `lineSectionController.renderCard()` ersetzen statt nur Rows/Outlets zu synchronisieren

## Modulpriorisierung fuer 42C/42D

1. `hx-diagram` – weil dev36 den Scrollsprung geloest, aber Diagramm-Synchronisierung gebrochen hat.
2. `rainwater` – wegen dokumentierter Hydration-/Precommit-Sonderhistorie und weiterhin vorhandenem Scrollsprung.
3. `heat-recovery` – wegen weiterhin vorhandenem Scrollsprung bei Saved-Aktionen.
4. `buffer-storage` – wegen gebrochener Selection/Edit-Funktion nach rows-only-Experimenten.
5. `ventilation` – wegen Saved-Load-Hydration-Problemen.

## Abschlussbewertung 42B

42B erzeugt keinen neuen Vertrag, sondern legt die Auslegung des bestehenden Vertrags fest:

- Referenz fuer Save/Edit/Selection bleibt zentral.
- `lineSectionController` und `moduleRuntime.savedConfig` sind beide zentrale Wege, duerfen aber pro Modul nicht parallel konkurrieren.
- h,x braucht einen Outlet-Vertrag, nicht rows-only.
- Scroll-Stabilitaet wird durch minimale, layoutstabile Updates erreicht, nicht durch weitere CSS- oder Scroll-Restore-Hotfixes.

Naechster Schritt: 42C erstellt daraus einen konkreten Legacy-Removal-Plan mit Code-Inventory pro Modul, bevor Runtime-Code geaendert wird.
