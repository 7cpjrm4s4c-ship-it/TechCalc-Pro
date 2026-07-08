# Contract – WRG/Mischluft-Modulsplitting

## Geltungsbereich

Dieser Contract definiert das Zielverhalten für Version `1.3.3` beim Split des bisherigen Kombimoduls `heat-recovery` in die Module `heat-recovery` und `mixed-air`.

## Zielmodule

| Zielmodul | Modul-ID | Fachlicher Umfang |
|---|---|---|
| Wärmerückgewinnung | `heat-recovery` | Außenluft, Abluft, Zuluft, WRG-Wirkungsgrad, Bypass, WRG-Leistung, RLT-Geräte |
| Mischluft | `mixed-air` | Außenluftstrom, Umluftstrom, Mischtemperatur, Mischfeuchte, Außenluftanteil, Kondensationsprüfung |

## Persistenzvertrag

Neue Projektdateien speichern beide Bereiche getrennt:

```json
{
  "modules": {
    "heat-recovery": {},
    "mixed-air": {}
  }
}
```

Altprojekte mit ausschließlich `modules['heat-recovery']` müssen weiterhin geladen werden. Die Migration muss idempotent sein: mehrfaches Laden/Speichern darf keine weiteren Strukturänderungen erzeugen.

## State-Trennschnitt

WRG-Felder:

- `wrgVolumeFlowM3h`
- `outdoorTemp`
- `outdoorRh`
- `extractTemp`
- `extractRh`
- `efficiency`
- `bypassPercent`

Mischluft-Felder:

- `outdoorVolumeFlowM3h`
- `outdoorMixTemp`
- `outdoorMixRh`
- `recircVolumeFlowM3h`
- `recircTemp`
- `recircRh`

Das historische Feld `mode` ist nur Migrationsinput. Neue Zielmodule benötigen kein gemeinsames Segmentfeld.

## Shared-Code-Vertrag

Gemeinsam genutzte psychrometrische Funktionen werden einmalig bereitgestellt. Zulässig sind gemeinsame reine Funktionen für:

- Sättigungsdampfdruck
- Feuchtegehalt
- Luftdichte
- Luftpunktmodell
- Enthalpie-/Massenstrom-Helfer, sofern vorhanden

Nicht zulässig ist eine gemeinsame Zielmodul-Logik, die erneut per `mode` dispatcht. Jedes Zielmodul besitzt eine eigene `calculate`-Funktion mit eigenem Modulvertrag.

## UI-/Navigation-Vertrag

- Beide Zielmodule sind einzeln auswählbar.
- Das bisherige Kombimodul darf nach Aktivierung des Splits nicht zusätzlich als drittes Runtime-Modul erscheinen.
- Mobile Navigation, Desktop Navigation, Tastatursteuerung und Theme-Verhalten folgen den bestehenden Module-, Keyboard- und Theme-Contracts.

## PDF-/Export-Vertrag

- PDF-Ausgaben dürfen WRG und Mischluft nicht mehr in einem kombinierten Abschnitt zusammenführen.
- Export-/Summary-Labels müssen eindeutig sein.
- Bestehende Altprojektwerte müssen nach Migration in der PDF-Ausgabe fachlich unverändert erscheinen.

## Regression-Pflicht

Phase 45C/45D muss mindestens prüfen:

1. Altprojekt mit WRG-Modus laden.
2. Altprojekt mit Mischluft-Modus laden.
3. Neues Projekt mit beiden Modulen speichern und laden.
4. PDF-Ausgabe für WRG.
5. PDF-Ausgabe für Mischluft.
6. Import/Export `.tcproj`.
7. Offline-Start nach Service-Worker-Cachewechsel.
8. Desktop Chrome, Edge, Firefox; iOS Safari/PWA; Windows PWA.

## Phase 45C Implementierungsstatus

Der Split ist ab `1.3.3-dev.3` technisch aktiv:

- `heat-recovery` rendert und berechnet ausschließlich Wärmerückgewinnung.
- `mixed-air` rendert und berechnet ausschließlich Mischluft.
- Projektdateien enthalten beide Modulschlüssel separat.
- Altprojekte mit Mischluftwerten im historischen `heat-recovery`-State werden beim Import auf `mixed-air` migriert.
