# Release Version Contract

Status: verbindlich ab TechCalc Pro 1.5.0
Stand: 2026-08-28

## Single Source of Truth
`package.json#version` ist die einzige manuell gepflegte App-Release-Version. Runtime-, PWA-, UI- und PDF-Dateien dürfen keine unabhängig gepflegte produktive App-Version besitzen.

## Synchronisierung
`npm run version:sync` synchronisiert Lockfile-Root, Manifest, `js/core/version.js`, App-Runtime-Metadaten, Release-Notes-Defaults, sichtbare/Feedback-Versionen und PDF-App-Metadaten. `npm run precache` führt dieselbe Synchronisierung aus und erzeugt danach Service-Worker-Cache-Name, Cache-Revision und Asset-Liste.

Ein Versionswechsel besteht aus der Änderung von `package.json#version` und der Ausführung des Build-/Precache-Prozesses. Manuelle Versionsänderungen in abgeleiteten Dateien sind unzulässig.

## Abgrenzung
Schema-, DTO-, Snapshot-, Kältemittel-, GWP- und Rechtsdatenversionen sind fachliche Versionen. Sie werden nicht aus der App-Version abgeleitet.

## Gates
`version:check` prüft, dass alle synchronisierten Dateien bereits dem Package-Stand entsprechen. Release-Readiness prüft zusätzlich Manifest, Lockfile, Runtime, Flooding-PDF, UI-Marker sowie Service-Worker-Cache und Precache. CI synchronisiert zuerst deterministisch und führt danach sämtliche Gates aus. Eine Abweichung nach der Synchronisierung ist ein Release-Blocker.
