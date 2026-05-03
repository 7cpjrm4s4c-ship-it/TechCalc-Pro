# TechCalc Pro v2 — React PWA Refactor Documentation

## 📋 Übersicht

Dies ist eine **vollständige Umstrukturierung** der TechCalc Pro App von Vanilla JS zu React mit modernem Design System. Das Projekt behält alle Funktionalität, verbessert aber:

- ✅ **Responsive 12-column Grid Layout** (mobile-first)
- ✅ **Design Token System** (Farben, Spacing, Typography)
- ✅ **Component-driven Architecture** (reusable components)
- ✅ **Clean Separation of Concerns** (layout, components, logic)
- ✅ **Modern CSS** (no Tailwind, pure CSS with custom properties)
- ✅ **Light/Dark Theme Support**
- ✅ **PWA-ready** (Service Worker, Offline-First)

---

## 🏗️ Projektstruktur

```
techcalc-v2/
├── public/
│   ├── index.html          # Root HTML
│   ├── manifest.json       # PWA Manifest
│   ├── icons/             # App Icons (192, 512, etc.)
│   └── sw.js              # Service Worker (updated for React)
│
├── src/
│   ├── App.jsx            # Main App Component
│   ├── App.css            # App-level styles
│   ├── index.jsx          # React entry point
│   │
│   ├── styles/
│   │   ├── tokens.css     # Design Token System (CRITICAL)
│   │   ├── layout.css     # Grid, Spacing, Responsive
│   │   ├── components.css # Component Styles
│   │   └── utilities.css  # Helper Classes
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── TabNav.jsx
│   │   │   └── Footer.jsx
│   │   │
│   │   ├── common/
│   │   │   ├── Card.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── NumberInput.jsx
│   │   │   ├── SelectInput.jsx
│   │   │   ├── ResultRow.jsx
│   │   │   └── Badge.jsx
│   │   │
│   │   ├── modules/
│   │   │   ├── HeatingCooling.jsx     (hx-engine.js)
│   │   │   ├── Ventilation.jsx        (ventilation.js)
│   │   │   ├── Mag.jsx                (mag.js)
│   │   │   ├── Entwaesserung.jsx      (entwaesserung.js)
│   │   │   ├── Wrg.jsx                (wrg-mischluft.js)
│   │   │   └── Trinkwasser.jsx        (trinkwasser.js)
│   │   │
│   │   └── diagrams/
│   │       └── HXDiagram.jsx          (Canvas visualization)
│   │
│   ├── utils/
│   │   ├── calculations.js            # Core calculation logic
│   │   ├── formatting.js              # Number formatting, localization
│   │   ├── storage.js                 # localStorage management
│   │   └── constants.js               # Enums, lookup tables
│   │
│   └── hooks/
│       ├── useLocalStorage.js
│       └── useTheme.js
│
└── package.json
```

---

## 🎨 Design System (tokens.css)

### Spacing Scale (8px Base)

```css
--space-xs: 4px;    /* half-step */
--space-sm: 8px;    /* 1x */
--space-md: 16px;   /* 2x */
--space-lg: 24px;   /* 3x */
--space-xl: 32px;   /* 4x */
--space-2xl: 48px;  /* 6x */
--space-3xl: 64px;  /* 8x */
```

### Color Palette (Dark Mode Default)

```css
/* Backgrounds */
--color-bg-primary: #000000;       /* Page background */
--color-bg-secondary: #0a0a0a;     /* Surfaces, footer */
--color-bg-tertiary: #141414;      /* Hover state */

/* Glass & Transparency */
--color-glass-low: rgba(255,255,255,0.04);
--color-glass-mid: rgba(255,255,255,0.08);
--color-glass-high: rgba(255,255,255,0.12);

/* Semantic Colors */
--color-heat: #ff6b35;    /* Heating, warm */
--color-cold: #00c4e8;    /* Cooling, cold */
--color-air: #a78bfa;     /* Ventilation */
--color-ok: #34d399;      /* Success, valid */
--color-warn: #fbbf24;    /* Warning */
--color-danger: #ff453a;  /* Error, critical */

/* Text */
--color-text-primary: rgba(255,255,255,0.95);    /* Main text */
--color-text-secondary: rgba(255,255,255,0.65);  /* Labels */
--color-text-tertiary: rgba(255,255,255,0.40);   /* Hints */
--color-text-disabled: rgba(255,255,255,0.20);   /* Disabled */

/* Borders */
--color-border-soft: rgba(255,255,255,0.06);
--color-border-mid: rgba(255,255,255,0.12);
--color-border-strong: rgba(255,255,255,0.20);
```

### Breakpoints

- **Mobile**: < 768px (default, full-width 12 columns)
- **Tablet**: 768px - 1023px (max-width 748px, better readability)
- **Desktop**: 1024px+ (max-width 1000px)
- **Wide**: 1440px+ (max-width 1320px)

---

## 📐 Grid System

### 12-Column Layout (Mobile-First)

```html
<!-- Mobile: Full width, 12 columns -->
<div class="container">
  <div class="col-12">Full width on mobile</div>
  <div class="col-6">Half width on mobile</div>
  <div class="col-4">Third on mobile</div>
</div>

<!-- Tablet: 6-column layout -->
<div class="container">
  <div class="col-12 col-tablet-6">Full on mobile, half on tablet</div>
  <div class="col-12 col-tablet-6">Full on mobile, half on tablet</div>
</div>

<!-- Desktop: 8-4 or 7-5 split -->
<div class="container">
  <div class="col-12 col-desktop-8">Input section (left)</div>
  <div class="col-12 col-desktop-4">Results (right)</div>
</div>
```

### Responsive Behavior

| Breakpoint | Max Width | Padding | Gap  | Columns |
|------------|-----------|---------|------|---------|
| Mobile    | 100%      | 16px    | 12px | 12      |
| Tablet    | 748px     | 20px    | 16px | 12      |
| Desktop   | 1000px    | 24px    | 24px | 12      |
| Wide      | 1320px    | 24px    | 24px | 12      |

---

## 🧩 Component Architecture

### Base Components (components/common/)

**Card.jsx** - Container for content
```jsx
<Card title="Eingaben — MAG">
  <NumberInput label="Volumen" value={VA} onChange={setVA} unit="l" />
  <ResultRow label="Ergebnis" value={123} unit="l" accent="--color-ok" />
</Card>
```

**NumberInput.jsx** - Form input with units
```jsx
<NumberInput 
  label="Temperatur" 
  value={temp} 
  onChange={setTemp} 
  unit="°C"
  min={-50}
  hint="Minimum ist Umgebungstemperatur"
/>
```

**SelectInput.jsx** - Dropdown
```jsx
<SelectInput 
  label="System" 
  value={system} 
  onChange={setSystem}
  options={[
    { value: 'heating', label: 'Heizung' },
    { value: 'cooling', label: 'Kühlung' },
  ]}
/>
```

**ResultRow.jsx** - Display calculated value
```jsx
<ResultRow 
  label="Dimensionierung" 
  value={123.45} 
  unit="l" 
  accent="--color-ok"
/>
```

**Button.jsx** - CTA button
```jsx
<Button 
  variant="primary" 
  onClick={handleExport}
>
  📥 PDF Exportieren
</Button>
```

### Module Components (components/modules/)

Each module is a self-contained React component:

```jsx
function MagModule() {
  const [state, setState] = useState({...});
  const [results, setResults] = useState(null);
  
  const calculate = () => {
    // Calculation logic (from mag.js)
    // Update results
  };
  
  useEffect(() => {
    calculate();
  }, [state]);
  
  return (
    <>
      <div className="col-12 col-tablet-6">
        <Card title="Inputs">
          {/* Input components */}
        </Card>
      </div>
      <div className="col-12 col-tablet-6">
        <Card title="Results">
          {/* Result rows */}
        </Card>
      </div>
    </>
  );
}
```

---

## 🔄 State Management Pattern

### Simple Modules (MAG, Ventilation)

Use React hooks directly:

```jsx
const [input1, setInput1] = useState('');
const [input2, setInput2] = useState('');
const [results, setResults] = useState(null);

useEffect(() => {
  const result = calculate(input1, input2);
  setResults(result);
}, [input1, input2]);
```

### Complex Modules (Entwässerung with Strangliste)

Use `useReducer` for complex state:

```jsx
const [state, dispatch] = useReducer(reducer, initialState);

const addStrang = () => {
  dispatch({ type: 'ADD_STRANG', payload: {...} });
};

const deleteStrang = (id) => {
  dispatch({ type: 'DELETE_STRANG', payload: id });
};
```

### Persist to localStorage

```jsx
useEffect(() => {
  localStorage.setItem('ew-stranges', JSON.stringify(state.stranges));
}, [state.stranges]);

useEffect(() => {
  const saved = localStorage.getItem('ew-stranges');
  if (saved) dispatch({ type: 'LOAD', payload: JSON.parse(saved) });
}, []);
```

---

## 📱 Responsive Behavior

### Mobile (< 768px)

- Full-width cards stacked vertically
- Single column inputs
- Larger touch targets (44px minimum)
- Simplified diagrams

### Tablet (768px - 1023px)

- 2-column layout where applicable
- Inputs on left, results on right
- Touch-optimized spacing

### Desktop (1024px+)

- 3-column layouts possible
- Input + Result + Diagram side-by-side
- Hover effects on components

---

## 🎯 CSS Class Conventions

### Layout Classes

```css
.container          /* 12-column grid wrapper */
.col-12, .col-6     /* Grid column spans */
.flex, .flex-col    /* Flexbox utilities */
.gap-lg, .gap-md    /* Gap utilities */
```

### Component Classes

```css
.card               /* Card container */
.card-title         /* Card heading */
.card-body          /* Card content wrapper */

.button             /* Base button */
.button-primary     /* Primary variant */
.button-secondary   /* Secondary variant */

.input              /* Form input */
.input-group        /* Input + label wrapper */
.input-label        /* Input label */
```

### State Classes

```css
.active             /* Active tab/button */
.disabled           /* Disabled state */
.has-error          /* Error state */
.loading            /* Loading state */
```

---

## 🚀 Module Porting Checklist

### Template for New Module

```jsx
// components/modules/NewModule.jsx
import React, { useState, useEffect } from 'react';
import { Card, NumberInput, SelectInput, ResultRow, Button } from '../common';

export default function NewModule() {
  // 1. State
  const [inputs, setInputs] = useState({...});
  const [results, setResults] = useState(null);
  
  // 2. Calculate function (from original JS)
  const calculate = () => {
    // Translate from old JS logic
    // Return calculated values
  };
  
  // 3. Update on input change
  useEffect(() => {
    calculate();
  }, [Object.values(inputs)]);
  
  // 4. Render layout
  return (
    <>
      <div className="col-12 col-tablet-6">
        <Card title="Eingaben">
          {/* Inputs */}
        </Card>
      </div>
      <div className="col-12 col-tablet-6">
        <Card title="Ergebnisse">
          {/* Results */}
        </Card>
      </div>
    </>
  );
}
```

---

## 📦 Package.json

```json
{
  "name": "techcalc-v2",
  "version": "2.0.0",
  "type": "module",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.3.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## 🔌 Service Worker Update

Update `sw.js` for React build:

```javascript
const BUILD_TS = '20260503-v2-react';
const CACHE_NAME = `techcalc-${BUILD_TS}`;

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  // dist files from React build
  './assets/main.*.js',
  './assets/main.*.css',
];
```

---

## 🎓 Key Design Principles

1. **Mobile-First**: Default is mobile, enhance for larger screens
2. **Semantic HTML**: Use native form elements, not custom replacements
3. **Component Reusability**: Small, focused components
4. **CSS-First Styling**: No UI frameworks, pure CSS with tokens
5. **Accessibility**: ARIA labels, keyboard navigation, color contrast
6. **Performance**: Minimal re-renders, lazy-load modules
7. **Offline-First**: Service Worker + localStorage for PWA

---

## 🔍 Testing Checklist

- [ ] All modules calculate correctly
- [ ] Mobile layout stacks properly
- [ ] Tablet layout shows 2 columns
- [ ] Desktop shows side-by-side
- [ ] Theme toggle works
- [ ] localStorage persists state
- [ ] Service Worker caches assets
- [ ] Touch targets are 44px minimum
- [ ] Color contrast > 4.5:1
- [ ] No console errors

---

## 📚 File References

Original → React Component Mapping:

| Original File | React Component | Location |
|---|---|---|
| mag.js | MagModule.jsx | components/modules/ |
| ventilation.js | VentilationModule.jsx | components/modules/ |
| entwaesserung.js | EntwaesserungModule.jsx | components/modules/ |
| wrg-mischluft.js | WrgModule.jsx | components/modules/ |
| hx-engine.js | HeatingCoolingModule.jsx | components/modules/ |
| trinkwasser.js | TrinkwasserModule.jsx | components/modules/ |
| pdf-export.js | (separate, not part of main app) | – |

---

## 🚢 Deployment

```bash
# Build
npm run build

# Output: dist/
# Deploy to GitHub Pages / Vercel

# PWA compatible
# - manifest.json in public/
# - icons in public/icons/
# - Service Worker in public/sw.js
```

---

## 🎯 Next Steps

1. ✅ Create React project (Vite recommended)
2. ✅ Copy design tokens (tokens.css)
3. ✅ Copy layout system (layout.css)
4. ✅ Port common components
5. 🔄 Port modules one by one:
   - Start with MAG (simplest)
   - Then Ventilation
   - Then Entwässerung (most complex)
6. 🧪 Test responsiveness at all breakpoints
7. 🚀 Deploy to production

---

**Version**: 2.0  
**Last Updated**: May 2026  
**Framework**: React 18+ with Vite  
**CSS**: Pure CSS (no Tailwind, but design-token based)
