# Phase 36P – h,x Syntaxfix + tiefer Spacing-Fix

## h,x Syntaxfix
Der fehlerhafte doppelte Funktionsrest in `renderPipeline.js` wurde entfernt. `renderDynamicSections()` endet wieder sauber mit einer einzelnen schließenden Klammer.

## Spacing-Befund
Die vorherige 36O-Regel griff vermutlich nicht überall, weil sie zu eng auf `.module-view` zielte und einzelne Modulwrapper/Stacks nicht erreichte.

## Spacing-Fix
- autoritativer globaler Abstand `--tc-module-gap: 10px`
- robuste Selektoren für `.module-view`, `.module-shell`, `.module-grid`, `.tc-module`, `#moduleRoot`, `#app [data-module]`
- `.card__body`, `.tc-stack`, `.stack` verwenden einheitlich `gap: 10px`
- alte Kind-Margins in Cards/Stacks werden neutralisiert
- `data-rw-dynamic` und `data-ww-dynamic` werden layout-neutral gestellt, damit Wrapper keine Sonderabstände erzeugen

## CSS-Fundstellen vor Fix
{
  "css/components.css": [
    "rainwater",
    "wastewater",
    "--tc-gap",
    "gap:",
    ".span-6",
    ".tc-stack",
    ".card"
  ],
  "css/layout.css": [
    "gap:",
    ".span-6",
    ".tc-stack",
    ".card"
  ],
  "css/modules.css": [
    "rainwater",
    "wastewater",
    "--tc-gap",
    "gap:",
    ".card"
  ],
  "css/tokens.css": [
    "--tc-gap",
    "gap:",
    ".card"
  ]
}