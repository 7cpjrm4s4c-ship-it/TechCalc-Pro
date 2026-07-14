# Phase 47C.6.2 – DWA-A 117 Anwendungsprüfung

## Ziel

Automatische, deterministische Prüfung der im Contract 47B.1 festgelegten Anwendungsgrenzen des einfachen Verfahrens nach DWA-A 117.

## Statusmodell

- `inactive`: Rückhalteraumnachweis ist nicht aktiv oder es liegt keine behördliche Einleitungsbegrenzung vor.
- `incomplete`: Pflichtangaben für die Anwendungsprüfung fehlen.
- `applicable`: harte Anwendungsgrenzen und empirischer fA-Gültigkeitsbereich sind eingehalten.
- `preliminary-only`: die harten Anwendungsgrenzen sind eingehalten, der empirische fA-Gültigkeitsbereich ist jedoch überschritten.
- `long-term-simulation-required`: mindestens eine harte Anwendungsgrenze ist nicht eingehalten.

## Geprüfte Grenzen

Harte Anwendungsgrenzen:

- Einzugsgebietsfläche höchstens 200 ha oder Fließzeit höchstens 15 min,
- Überschreitungshäufigkeit `n >= 0,1/a`,
- Regenanteil der Drosselabflussspende `qDr,R,u >= 2 l/(s·ha)`.

Empirischer Gültigkeitsbereich für `fA`:

- `0 <= tf <= 30 min`,
- `2 <= qDr,R,u <= 40 l/(s·ha)`,
- `0,1 <= n <= 1,0/a`.

## Architektur

Die Prüfung ist eine reine, DOM- und persistenzfreie Fachfunktion. Die Ergebnisdarstellung verwendet den zentralen Result-Renderer. Es wurden keine modulspezifischen UI-Komponenten oder CSS-Regeln ergänzt.

## Regression

Abgedeckt sind:

- Inaktivität außerhalb der behördlichen Begrenzung,
- unvollständige Eingaben,
- uneingeschränkt anwendbarer Referenzfall,
- harte Grenzüberschreitung,
- Überschreitung des empirischen fA-Bereichs,
- ODER-Regel aus Einzugsgebietsfläche und Fließzeit.
