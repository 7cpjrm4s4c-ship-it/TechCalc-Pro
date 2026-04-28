TechCalc Pro — gepatchter stabiler Stand

Korrekturen:
- Trinkwasser-Modul vollständig integriert: Tab, Plus-Menü, Script, PDF, Service Worker Cache.
- Bottom-Pill Keyboard Guard für iOS/Android Tastatur.
- Service Worker robust versionierbar und fehlertoleranter beim Precache.
- deploy.sh repariert und setzt BUILD_TS zuverlässig.
- Analytics randomUUID-Fallback für ältere Browser.
- Tab-Guards in app.js für zukünftige Module.

Hinweis:
styles.css bleibt im Paket, wird aber bewusst nicht geladen, da aktive Styles über tokens/layout/components laufen und styles.css alte HX-Regeln enthält.
