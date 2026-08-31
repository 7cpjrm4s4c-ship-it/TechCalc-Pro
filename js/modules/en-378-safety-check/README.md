# EN 378 Sicherheitscheck

## Zweck

Dieses Modul bereitet den sicherheitstechnischen EN-378-Sicherheitscheck für TechCalc Pro Version 1.6.0 vor.

Der aktuelle Stand enthält ausschließlich technische Modulstruktur, Snapshot-Import, Eingabevalidierung, Ergebnisaufbereitung, Report-DTO und Tests. Normative EN-378-Fachlogik ist noch nicht implementiert.

## Abgrenzung

Das Modul enthält keine regulatorischen Prüfungen der F-Gase-Verordnung. Regulatorische Inhalte bleiben im Modul `f-gases-check`.

Das Modul greift nicht direkt auf interne Zustände des F-Gase-Checks zu. Der Datenaustausch erfolgt über eine Kopie eines versionierten F-Gase-System-Snapshots.

## Import

Unterstützter Snapshot-Typ:

```text
techcalc.f-gases.system
```

Der Import prüft technisch:

- Snapshot-Typ
- Snapshot-Version
- vorhandenes `system`-Objekt
- vorhandenes Kältemittel
- positive Füllmenge

Importierte Daten werden kopiert. Spätere Änderungen an der Ursprungsanlage verändern die EN-378-Moduldaten nicht automatisch.

## Eingaben

Der technische Mindestumfang umfasst:

- importierte Anlage
- Kältemittel
- Füllmenge
- Raumvolumen
- Aufstellort
- Zugangsbereich
- Nutzung
- Lüftung
- Gaswarnsystem
- Maschinenraum
- weitere Sicherheitsmaßnahmen

## Noch nicht implementiert

Folgende Inhalte sind bewusst nicht enthalten:

- zulässige Füllmengen nach EN 378
- normative Grenzwerttabellen
- sicherheitstechnische Konformitätsbewertung
- Ableitung notwendiger Schutzmaßnahmen
- Lüftungsanforderungen
- Gaswarnsystem-Erforderlichkeit
- Maschinenraum-Bewertung

Diese Punkte benötigen gesicherte Fachlogik und dürfen nicht spekulativ ergänzt werden.

## Tests

Der fokussierte technische Test liegt unter:

```text
scripts/test-en-378-safety-check.mjs
```

Der Test prüft Snapshot-Import, defensive Validierung, Eingabevalidierung, Report-DTO und serialisierbare Modulgrenzen ohne EN-378-Fachbewertung.
