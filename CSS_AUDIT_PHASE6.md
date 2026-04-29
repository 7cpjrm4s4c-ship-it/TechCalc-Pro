# TechCalc Pro — CSS Audit Phase 6

- style.css: 259 !important, 1 nth-Selektoren
- components.css: 0 !important, 0 nth-Selektoren
- layout.css: 285 !important, 22 nth-Selektoren
- styles.css: 52 !important, 0 nth-Selektoren
- index.html: 136 Inline-Styles verbleibend

Bewertung: Phase 6 reduziert die Abhängigkeit von Legacy-Regeln über stärkere zentrale Vertragsklassen, löscht aber bewusst noch keine großen Legacy-Blöcke. Das schützt die lauffähige App. Die verbleibenden `!important`- und Inline-Style-Altlasten sind Ziel für Phase 7.
