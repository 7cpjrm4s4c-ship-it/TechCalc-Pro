# QM-010 Performance

Status: verbindlich ab Version 1.3.3-dev.7

## Grundsätze

- Keine unnötigen Dateien, Duplikate oder Build-Artefakte im Development-Paket.
- Dead Code wird nach Referenz-, Import-, Export- und dynamischer Nutzungsprüfung entfernt.
- Große Projekte müssen weiterhin bedienbar bleiben.
- Rendering und Eingabe dürfen nicht durch unnötige globale Reflows verschlechtert werden.

## Beobachtung

Runtime Diagnostics erfolgen über zentrale Logger-Mechanismen. Development darf detaillierte Hinweise liefern; Release soll auf relevante Fehler begrenzt bleiben.
