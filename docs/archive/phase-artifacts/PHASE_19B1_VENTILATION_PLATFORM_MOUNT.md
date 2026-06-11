# Phase 19B.1 – Lüftung Platform Mount

- Lüftung nutzt nun `createPlatformModule(...)` mit Custom View/Dynamic Adapter.
- Der eigene `mountVentilation()`-Subscribe-Zyklus wurde entfernt.
- `bindCommonInputs` und `bindNoClickScroll` werden durch die Plattform-Runtime ausgeführt.
- Bestehende Lüftungs-Dynamic- und Saved-Line-Section-Logik bleibt als Adapter erhalten und wird in späteren Phasen weiter zentralisiert.
