# Security Hardening 1.3.4

Status: verbindlich ab Phase 46B

## Ziel

Phase 46B schließt die seit 1.3.1 offene mittelfristige Härtung zum `innerHTML`-Audit ab. Ziel ist kein vollständiger Verzicht auf HTML-Templates, sondern ein kontrollierter DOM-Sink-Vertrag:

- `innerHTML` darf nur in zentralen Renderpfaden oder dokumentierten Dynamic-Renderer-Dateien verwendet werden.
- Externe oder dynamisch geladene Textinhalte dürfen nicht ungeprüft als HTML injiziert werden.
- Release Notes aus `RELEASE_NOTES.md` werden als Text gerendert und nicht mehr per Template-String direkt in `innerHTML` geschrieben.
- Neue DOM-/Code-Sinks wie `insertAdjacentHTML`, `outerHTML`-Assignments, `document.write`, `eval` und `new Function` sind im Runtime-Code verboten.

## Ergebnis des DOM-Sink-Audits

Erlaubte `innerHTML`-Nutzung ist auf folgende Klassen begrenzt:

1. zentrale Plattform-Renderer (`moduleRuntime`, `domUpdate`, globale Navigation),
2. kontrollierte Dynamic-Islands der Fachmodule,
3. statische Shell-Hinweise ohne Nutzerinhalt,
4. testkompatible Fallbacks für nicht browserähnliche Test-Doubles.

Die Release-Notes-Anzeige wurde gehärtet: In echten Browsern wird über DOM-Knoten und `textContent` gerendert. Der reine `innerHTML`-Fallback bleibt nur für bestehende minimalistische Node-Test-Doubles erhalten und escaped alle Werte über den zentralen Renderer-Helfer.

## Qualitätssicherung

Der neue Audit `scripts/audit-dom-sinks-phase46b.mjs` ist Bestandteil von `npm run lint` und prüft:

- keine neuen nicht freigegebenen `innerHTML`-Dateien,
- keine verbotenen DOM-/Code-Sinks,
- Release Notes nutzen den zentralen Escape-Helfer,
- Release Notes rendern nicht mehr per direkter `host.innerHTML = notes.map(...)`-Pipeline.

## Abgrenzung

Es wurde kein akuter XSS-Befund festgestellt. Phase 46B ist eine präventive Härtung und macht die bisher offene Folgeaufgabe aus `SECURITY_REAUDIT_BETA31.md` nachvollziehbar abgeschlossen.
