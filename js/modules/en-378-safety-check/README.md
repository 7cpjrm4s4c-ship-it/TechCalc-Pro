# EN 378 Sicherheitscheck

## Zweck

Dieses Modul bereitet den sicherheitstechnischen EN-378-Sicherheitscheck für TechCalc Pro Version 1.6.0 vor.

Der aktuelle Stand enthält ausschließlich technische Modulstruktur, Snapshot-Import, Eingabevalidierung, Ergebnisaufbereitung, Report-DTO und Tests. Normative EN-378-Fachlogik ist noch nicht implementiert.

## Zielbild

Das Modul soll Planerinnen und Planern einen klaren Leitfaden für den gewählten Aufstellort liefern:

- welche Anforderungen der Aufstellort besitzt,
- welche Sicherheitskomponenten erforderlich sind,
- welche Maßnahmen umzusetzen sind,
- welche Angaben für eine Bewertung noch fehlen,
- welche Prüfpunkte nicht anwendbar sind.

Das Modul ersetzt keine vollständige Fachplanung und keine vollständige Normprüfung. Es konzentriert sich auf schnelle, praxisnahe Entscheidungsunterstützung für den Aufstellraum und die dort erforderlichen Sicherheitsmaßnahmen.

## Fachlicher Scope

### Kernquellen

Die spätere Fachlogik wird auf die für den Aufstellraum relevanten Inhalte begrenzt:

- EN 378-1: Kältemitteldaten, Sicherheitsklassen, Konzentrationsgrenzwerte, Füllmengenlogik, Aufstellort- und Zugangskategorien.
- EN 378-3: Aufstellort, Personenbereich, Maschinenraum, Lüftung, Detektion, Alarmierung, Abschaltung und Schutzmaßnahmen.

### Eingeschränkt berücksichtigte Quellen

EN 378-2 wird grundsätzlich nicht als Kernquelle des Moduls verwendet, da dieser Teil überwiegend Anforderungen an Gerätehersteller, Konstruktion, Herstellung und Prüfung beschreibt.

Inhalte aus EN 378-2 werden nur berücksichtigt, wenn sie einen direkten Bezug haben zu:

- Aufstellraum,
- Aufstellbedingungen,
- erforderlichen Sicherheitskomponenten,
- notwendigen Schutzmaßnahmen am Installationsort.

### Ausgeschlossene Quellen

DIN EN ISO 5149-4 / EN 378-4 ist nicht Teil der Kernbewertung dieses Moduls.

Nicht umgesetzt werden daraus insbesondere:

- Betriebsprozesse,
- Wartungsprozesse,
- Instandsetzung,
- Rückgewinnung,
- Wiederverwendung,
- Entsorgung,
- Kältemittelwechsel,
- Serviceprozesse.

Diese Themen gehören nicht zur Kernbewertung des Aufstellraumes und der benötigten Sicherheitskomponenten.

## Abgrenzung zum F-Gase-Check

Das Modul enthält keine regulatorischen Prüfungen der F-Gase-Verordnung. Regulatorische Inhalte bleiben im Modul `f-gases-check`.

Das Modul greift nicht direkt auf interne Zustände des F-Gase-Checks zu. Der Datenaustausch erfolgt über eine Kopie eines versionierten F-Gase-System-Snapshots.

## Import

Unterstützter Snapshot-Typ:

```text
techcalc.f-gases.system
```

Der Import prüft technisch:

- Snapshot-Typ,
- Snapshot-Version,
- vorhandenes `system`-Objekt,
- vorhandenes Kältemittel,
- positive Füllmenge.

Importierte Daten werden kopiert. Spätere Änderungen an der Ursprungsanlage verändern die EN-378-Moduldaten nicht automatisch.

## Eingaben

Der technische Mindestumfang umfasst:

- importierte Anlage,
- Kältemittel,
- Füllmenge,
- Raumvolumen,
- Aufstellort,
- Zugangsbereich,
- Nutzung,
- Lüftung,
- Gaswarnsystem,
- Maschinenraum,
- weitere Sicherheitsmaßnahmen.

## Geplante Prüfkategorien

Die spätere Bewertung soll planungsorientiert nach klaren Kategorien aufgebaut werden:

- `refrigerant`: Kältemittel, Sicherheitsklasse und relevante Grenzwerte,
- `chargeLimit`: Füllmenge, Raumvolumen und Konzentrationsbewertung,
- `location`: Aufstellort und Aufstellbedingungen,
- `occupancy`: Zugang, Nutzung und Personenbereich,
- `ventilation`: natürliche oder mechanische Lüftung,
- `machineryRoom`: Anforderungen an Maschinenräume,
- `detection`: Gasdetektion,
- `alarm`: Warnung und Alarmierung,
- `emergencyControl`: Abschaltung und Notfunktionen,
- `safetyMeasures`: erforderliche Schutzmaßnahmen,
- `guidance`: zusammenfassender Planerleitfaden.

## Noch nicht implementiert

Folgende Inhalte sind bewusst nicht enthalten:

- zulässige Füllmengen nach EN 378,
- normative Grenzwerttabellen,
- sicherheitstechnische Konformitätsbewertung,
- Ableitung notwendiger Schutzmaßnahmen,
- Lüftungsanforderungen,
- Gaswarnsystem-Erforderlichkeit,
- Maschinenraum-Bewertung,
- finale Planerempfehlung.

Diese Punkte benötigen gesicherte Fachlogik und dürfen nicht spekulativ ergänzt werden.

## Nicht-Ziele

Das Modul bewertet nicht:

- Herstelleranforderungen,
- Bauteilauslegung,
- Druckgeräteauslegung,
- Druckfestigkeitsprüfung,
- Produktions- oder Herstellerkennzeichnung,
- Betreiberpflichten aus der F-Gase-Verordnung,
- Wartung und Instandsetzung,
- Rückgewinnung und Entsorgung,
- Kältemittelwechsel,
- Serviceprozesse.

## Tests

Der fokussierte technische Test liegt unter:

```text
scripts/test-en-378-safety-check.mjs
```

Der Test prüft Snapshot-Import, defensive Validierung, Eingabevalidierung, Report-DTO und serialisierbare Modulgrenzen ohne EN-378-Fachbewertung.
