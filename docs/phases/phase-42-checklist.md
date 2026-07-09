# Phase 42 – Checklist

## 42A – Documentation Audit

- [x] `docs/architecture` gelesen und ausgewertet
- [x] `docs/audits` gescannt und relevante Befunde extrahiert
- [x] `docs/archive/phase-artifacts` auf historische Saved-/Scroll-Entscheidungen geprueft
- [x] `docs/phase36` auf h,x, Regenwasser, Tab/Enter, Saved-Record und Scroll-Befunde geprueft
- [x] `docs/phases` auf konsolidierte Phasenstruktur geprueft
- [x] Referenzmodule bestaetigt
- [x] Keine Runtime-Codeaenderungen vorgenommen

## 42B – Contract Reconciliation

- [x] `savedRecordController` und `lineSectionController` Vertrag vergleichen
- [x] Action-Namen und State-Patches normalisieren
- [x] Zielverhalten fuer Save/Edit/Selection dokumentieren
- [x] h,x Outlet-Vertrag dokumentieren
- [x] Regenwasser Precommit-/Hydration-Vertrag dokumentieren
- [x] Scroll-Stabilitaetsvertrag als bestehende Regel konsolidieren

## 42C – Legacy Removal Plan

- [x] lokale Scroll-Fixes identifizieren
- [x] lokale Saved-Handler identifizieren
- [x] lokale Focus-/Keydown-Handler identifizieren
- [x] direkte `innerHTML`-Dynamic-Rebuilds in kritischen Modulen bewerten
- [x] modulbezogene CSS-/UI-Sonderregeln gegen zentrale UI-Regeln pruefen

## 42D – Modulweise Umsetzung

- [x] `hx-diagram` gegen Diagramm-Outlets und zentralen Save-/Selection-Vertrag geprueft
- [x] `rainwater` gegen Precommit-/Hydration-Vertrag geprueft
- [x] `heat-recovery` auf zentralen RLT-/Row-Vertrag zurueckgefuehrt
- [x] `buffer-storage` wieder auf Referenzvertrag fuer Selection/Edit migriert
- [x] `ventilation` Saved-Selection wieder voll angebunden

## 42E – Abschluss

- [x] 42E.1 Keyboard-Navigationsvertrag dokumentiert
- [x] 42E.2 Legacy-Keyboard-Handler entfernt und dokumentiert
- [x] 42E.3 Keyboard-Regression-Guard ergaenzt
- [x] 42E.4 Phase-42-Dokumente konsolidiert
- [x] 42E.5 Trinkwasser-Mobile-Input-Vertrag geprueft und korrigiert
- [x] Regressionen dokumentiert
- [x] Tests/Gates dokumentiert
- [ ] RC-Faehigkeit final bewerten

