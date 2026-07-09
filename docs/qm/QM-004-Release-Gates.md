# QM-004 Release Gates

Status: verbindlich ab Version 1.3.3-dev.7

## Gate-Struktur

Release Gates prüfen Funktionsfähigkeit, Plattformverhalten und Qualitätsstatus vor RC oder Final Release.

## Mindestgates vor Release Candidate

1. Kernfunktionen und Modulberechnungen funktionieren.
2. UI/UX ist auf Desktop und Mobile konsistent.
3. Speichern, Laden, Import, Export und Migration funktionieren.
4. PDF-Export ist modulbezogen geprüft.
5. PWA Offline, Update, Cachewechsel und Installierbarkeit funktionieren.
6. Browser-Kompatibilität ist geprüft.
7. Runtime-Konsole enthält keine ungeklärten JavaScript-Fehler.
8. Build- und Testpipeline ist grün.
9. Dokumentation, Contracts, ADRs und Release Notes sind aktuell.
10. Paket-Artefakte enthalten keine `dist/`, `node_modules/`, Cache- oder Report-Leichen in Development-ZIPs.

## Gate 10 Cleanup Standard

Dead Code und Duplikate werden nicht nur markiert. Wenn keine dynamische Nutzung, Registrierung, Dokumentation oder Importbeziehung existiert, wird bereinigt. Ausnahmen müssen dokumentiert werden.
