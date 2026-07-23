# Phase 47C.7C – Professioneller Diagnosebereich

## Ziel

Der Überflutungsnachweis erhält ein zentrales, deterministisches Diagnosemodell. Die Ergebnisansicht enthält keine eigene fachliche Klassifikation.

## Statusmodell

- `complete` – Berechnung erfolgreich
- `complete-with-warnings` – Berechnung vollständig mit Warnungen
- `outside-domain` – Normbereich verlassen
- `incomplete` – Berechnung unvollständig

Jeder Status enthält eine eindeutige Bezeichnung und Begründung.

## Diagnoseklassen

Meldungen werden dedupliziert und in fester Reihenfolge ausgegeben:

1. Fehler
2. Warnungen
3. Empfehlungen
4. Hinweise

Der Adapter verarbeitet strukturierte Meldungen und weiterhin vorhandene String-Meldungen aus älteren Berechnungspfaden.

## Automatische Empfehlungen

Empfehlungen werden unter anderem erzeugt bei:

- offenem DIN- oder DWA-Nachweis,
- unvollständigen Eingaben,
- überschrittenem Anwendungsbereich,
- erforderlicher Langzeitsimulation,
- kritischem Flächenanteil über 70 Prozent.

## Result Model

Das Result Model enthält zusätzlich:

- `diagnostic.status`,
- `diagnostic.statusLabel`,
- `diagnostic.statusReason`,
- Meldungsanzahlen,
- gruppierte Meldungen,
- vorbereitete Notice-Cards.

Die Oberfläche rendert diese Werte ausschließlich über die zentralen Result- und Notice-Renderer.
