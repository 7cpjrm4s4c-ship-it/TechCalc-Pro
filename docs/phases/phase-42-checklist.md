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

- [ ] lokale Scroll-Fixes identifizieren
- [ ] lokale Saved-Handler identifizieren
- [ ] lokale Focus-/Keydown-Handler identifizieren
- [ ] direkte `innerHTML`-Dynamic-Rebuilds in kritischen Modulen bewerten
- [ ] modulbezogene CSS-/UI-Sonderregeln gegen zentrale UI-Regeln pruefen

## 42D – Modulweise Umsetzung

Reihenfolge erst nach 42B final festlegen. Kandidaten:

1. `hx-diagram`
2. `rainwater`
3. `heat-recovery`
4. `buffer-storage`
5. `ventilation`

## 42E – Abschluss

- [ ] Phase-42-Dokumente final konsolidieren
- [ ] Regressionen dokumentieren
- [ ] Tests/Gates dokumentieren
- [ ] RC-Faehigkeit bewerten

