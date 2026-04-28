TechCalc Pro — Phase 2 Dynamic Bottom Navigation

Umgesetzt:
- Bottom Navigation Pill wird auf mobilen Geräten dynamisch gerendert.
- 4 Schnellzugriffe werden aus localStorage geladen.
- Standard-Schnellzugriffe: Rohr, Trinkwasser, Einheiten, Heizung.
- Alle übrigen Module erscheinen automatisch im + Menü.
- Aktiver Tab wird dynamisch in Pill und + Menü markiert.
- Hilfsfunktionen für Phase 3 vorbereitet:
  setNavFavorites(['pipe','trinkwasser','unit','flow'])
  resetNavFavorites()
- Desktop Tab-Bar bleibt unverändert.
- Header-Menü bleibt unverändert; Schnellzugriffe-Hinweis aktualisiert.
- Service Worker Build aktualisiert.

Hinweis:
Phase 3 kann darauf aufbauen und eine Drag-&-Drop/UI zur freien Sortierung bereitstellen.
