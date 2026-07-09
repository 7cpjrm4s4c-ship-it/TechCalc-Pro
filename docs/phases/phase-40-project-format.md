# TechCalc Pro 1.3.1 Beta 24 – TCP Projektformat

Die Projektdatei wird ab Beta 24 als `.tcp` gespeichert. Intern ist `.tcp` ein ZIP-Container.

```
projekt.tcp
├── project.json
└── assets/
    └── company-logo.*
```

Vorteile:
- Firmenlogos bleiben beim Speichern/Laden erhalten.
- Projektdateien sind portabel und offlinefähig.
- Alte `.json` Projektdateien können weiterhin geöffnet werden.
