# TechCalc Pro 1.3.2-dev.33

## Deep Legacy Stability Cleanup

- Zentrale Tab-/Enter-Navigation akzeptiert jetzt auch legacy-nahe Formularfelder ohne `data-field`.
- Scroll-Stability-Presets für gespeicherte Inhalte verlängert und auf WRG/Mischluft, Pufferspeicher, Regenwasser und h,x erweitert.
- Safe-Area- und Header-Surface im Light Theme final synchronisiert; Header-Trennstrich entfernt.
- Input-Zoom-Guard erneut auf alle mobilen Formularfelder erweitert.
- Keine fachliche Berechnungslogik geändert.


### 1.3.2-dev.33

- Keine neue CSS-Hotfix-Datei angelegt.
- Light-Card-Rahmen in `theme-light-final.css` zentral fixiert.
- Lange Scroll-Restore-Ketten aus Saved-Record-Aktionen entfernt.
- h,x lokale Scroll-Freeze-Hilfsfunktionen entfernt, da sie mit der zentralen Scroll-Stability konkurrierten.
