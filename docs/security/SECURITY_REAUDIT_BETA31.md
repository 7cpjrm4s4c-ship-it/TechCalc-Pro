# TechCalc Pro 1.3.1 Beta 31 – Security Re-Audit Follow-up

## Umgesetzt

- Service-Worker-Update-Flow repariert: wartende Worker werden per Nutzeraktion mit `SKIP_WAITING` aktiviert; `controllerchange` lädt die App anschließend neu.
- Update-Hinweis als UI-Banner ergänzt, kein automatischer Reload während laufender Sessions.
- Feedback-Formular um Honeypot-Feld `_gotcha` ergänzt.
- Feedback-Spam aus Honeypot-Pfaden wird lokal neutral behandelt und nicht an Formspree gesendet.
- Security-Header, CSP, SVG/SVP-Ausschluss und Logo-Größenlimit aus Beta 30 bleiben aktiv.

## Weiterhin organisatorisch

- Formspree-Rate-Limits, Spam-Filter und ggf. Captcha müssen zusätzlich im Formspree-Dashboard aktiviert werden.

## Folgeaufgabe

- innerHTML-Audit bleibt als mittelfristige Härtung geplant. Die kritischsten Import-/Logo-Pfade sind durch CSP, MIME-/Signaturprüfung und SVG-Ausschluss entschärft.
