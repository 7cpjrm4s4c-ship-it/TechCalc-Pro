# Runtime Compatibility Entrypoints

Status: verbindlich ab Version 1.3.3-rc.1 / Phase 45E.6

Dieses Dokument hält bewusst erhaltene Core-Dateien fest, die nicht in jedem Fall über statische Imports erreichbar sind oder als Kompatibilitäts-/Audit-Entrypoints bestehen. Sie dürfen nicht allein aufgrund fehlender statischer Inbound-Imports entfernt werden.

## Erhaltene Entrypoints

- `js/core/eventDelegation.js` – historischer Event-Delegation-Adapter und Prüfanker für Event-System-Regressionen.
- `js/core/moduleContract.js` – Kompatibilitäts- und Contract-Entrypoint für ältere Plattform-/Auditpfade.
- `js/core/pdfExport.js` – dynamisch geladener PDF-Export-Entrypoint aus `js/core/app.js`.
- `js/core/platformLifecycle.js` – Plattform-Lifecycle-Kompatibilitätsdatei und Audit-Anker.
- `js/core/resultRenderer.js` – Core-Kompatibilitäts-Entrypoint für den zentralen Result-Renderer-Vertrag.

## Regel

Vor Entfernen dieser Dateien muss zuerst der jeweilige Kompatibilitätsvertrag aufgehoben und durch eine neue ADR dokumentiert werden.
