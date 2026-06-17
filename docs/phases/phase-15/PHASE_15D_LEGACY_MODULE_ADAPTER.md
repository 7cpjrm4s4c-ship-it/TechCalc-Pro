# Phase 15D – Legacy Module Adapter

Ziel dieser Phase ist ein einheitlicher Modul-Lifecycle für globale und noch nicht vollständig migrierte Module.

## Zentrale Regel

Jedes Modul läuft ab sofort über denselben Mount-Vertrag:

1. Root-Lifecycle bereinigen
2. altes Modul aborten
3. stale Event-Pipelines entfernen
4. neues Modul mounten
5. Cleanup zentral registrieren
6. beim Modulwechsel zentral unmounten

## Warum

Heizung/Kälte und Lüftung sind bereits stark store-/pipeline-getrieben. Beim Wechsel zu älteren Modulen konnten alte Ressourcen aktiv bleiben. Der Adapter kapselt diese Unterschiede, bis alle Module vollständig globalisiert sind.

## Übergangsvertrag

Module können weiterhin `mount(root)` exportieren. Optional können sie künftig `mount(root, lifecycle)` nutzen und eigene Cleanup-Funktionen über `lifecycle.addCleanup()` registrieren.
