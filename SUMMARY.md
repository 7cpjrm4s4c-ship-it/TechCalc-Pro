# 📦 TechCalc Pro v2 — Deliverables Summary

## 🎯 Was wurde erstellt

Eine **vollständig moderni sierte React-PWA** basierend auf eurer bestehenden TechCalc Pro App mit:

✅ Responsives 12-column Grid Layout (mobile-first)  
✅ Modern Design Token System (Farben, Spacing, Typography)  
✅ Reusable Component-driven Architecture  
✅ Light/Dark Theme Support  
✅ PWA-ready (Service Worker, Offline)  
✅ Functional MAG + Ventilation modules als Demo  
✅ Placeholder für alle anderen Module  

---

## 📁 Dateien in /outputs/

### 1. **TechCalcPro-v2-React.jsx** (Hauptkomponente)

**Größe**: ~1000 Zeilen  
**Inhalt**: 
- Komplette App mit allen CSS tokens eingebettet
- MAG Modul (vollständig portiert und funktionsfähig)
- Ventilation Modul (vollständig portiert und funktionsfähig)
- Placeholder für Entwaesserung, WRG, Trinkwasser, Heizung/Kühlung
- Header mit Theme Toggle
- Tab Navigation
- Reusable Components (Input, Select, Card, Button, ResultRow)

**Verwendung**: Direkt in `src/App.jsx` kopieren oder als Referenz nutzen

---

### 2. **DOCUMENTATION.md** (Komplett Handbuch)

**Größe**: ~700 Zeilen  
**Inhalt**:
- Projektstruktur (als Ordnerbaum)
- Design System Erklärung
- Grid System (12 Spalten, Breakpoints)
- Component Architecture (Base, Module, Diagram)
- State Management Pattern
- Responsive Behavior Details
- Module Porting Checklist & Template
- Service Worker Update
- File Mapping (Old → React)

**Verwendung**: Referenz während Entwicklung, Architektur verstehen

---

### 3. **SETUP_GUIDE.md** (Praktische Anleitung)

**Größe**: ~400 Zeilen  
**Inhalt**:
- 5-Minuten Quick Start
- Project Structure Befehle
- Vite Konfiguration (vite.config.js)
- package.json Template
- manifest.json (PWA)
- Service Worker aktualisiert
- Build & Deploy Instructions
- Testing Responsive Design
- Troubleshooting

**Verwendung**: Step-by-Step Anleitung zum Projekt aufsetzen

---

### 4. **Design System Dateien** (in /home/claude/)

#### tokens.css
- Color Palette (Dark + Light Mode)
- Spacing Scale (8px base: xs, sm, md, lg, xl, 2xl, 3xl)
- Typography (sizes, weights, line-heights)
- Border Radius, Shadows, Transitions
- CSS Custom Properties für alles

#### layout.css
- 12-column Grid System
- Responsive Breakpoints (768px, 1024px, 1440px)
- Flex utilities
- Spacing utilities
- Typography utilities
- Layout primitives (main, header, nav, content, footer)

#### components.css
- Button styles (primary, secondary, ghost, danger, success, sizes)
- Card styles (standard, input, result, diagram)
- Form elements (input, select, labels, hints)
- Result rows
- Tabs
- Badges
- Alerts & Loading states
- Dividers

**Verwendung**: Kopieren nach `src/styles/`

---

## 🚀 Schritt-für-Schritt Umsetzung

### Phase 1: Projekt Setup (1-2 Stunden)

```bash
# 1. Vite Project erstellen
npm create vite@latest techcalc-v2 -- --template react
cd techcalc-v2
npm install

# 2. Projektstruktur erstellen
mkdir -p src/components/layout
mkdir -p src/components/common
mkdir -p src/components/modules
mkdir -p src/styles
mkdir -p src/utils

# 3. Design System kopieren
# Copy: tokens.css, layout.css, components.css zu src/styles/

# 4. App.jsx mit Inhalten füllen
# Copy: TechCalcPro-v2-React.jsx Inhalte zu src/App.jsx

# 5. index.html aktualisieren
# Manifest, Meta Tags, Icons

# 6. Testen
npm run dev
```

### Phase 2: Module Portieren (2-4 Stunden pro Modul)

**Reihenfolge** (einfach → komplex):

1. **MAG Module** ✅ (bereits fertig als Demo)
2. **Ventilation** ✅ (bereits fertig als Demo)
3. **Trinkwasser** (relativ einfach)
4. **Heating/Cooling** (HX Engine - etwas komplexer)
5. **WRG & Mischluft** (komplex - mehrere Eingabefelder)
6. **Entwässerung** (KOMPLEX - mit Strangliste, localStorage)

**Pro Modul**:
- Alt-Code analysieren (z.B. mag.js)
- Berechnung in React-Funktion übersetzen
- Input-Komponenten erstellen
- Result-Rows hinzufügen
- localStorage-Persistierung (falls nötig)
- Testen auf allen Breakpoints

### Phase 3: Polish & Testing (2-3 Stunden)

- Light/Dark Theme testen
- Responsive bei 390px, 768px, 1024px testen
- Alle Module testen
- Performance optimieren
- Accessibility prüfen (contrast, ARIA labels)
- Service Worker testen (offline)

### Phase 4: Deployment (30 Minuten)

```bash
npm run build
# Deploy dist/ zu GitHub Pages / Vercel / Netlify
```

---

## 🎨 Design System Highlights

### Spacing (8px Base Scale)

```
4px  → xs (halber step)
8px  → sm (1x)
16px → md (2x)
24px → lg (3x)
32px → xl (4x)
48px → 2xl (6x)
64px → 3xl (8x)
```

### Colors (Dark Mode)

```
Primary:  #5b52ff (Purple gradient)
Heat:     #ff6b35 (Orange - Heizung)
Cold:     #00c4e8 (Cyan - Kühlung)
Air:      #a78bfa (Lavender - Lüftung)
Success:  #34d399 (Green - OK)
Warning:  #fbbf24 (Amber - Warnung)
Danger:   #ff453a (Red - Fehler)
```

### Responsive Grid

```
Mobile   (< 768px):  Full width, 12 cols
Tablet   (768-1023): Max 748px, 2-col layout
Desktop  (1024+):    Max 1000px, 3-col layout
Wide     (1440+):    Max 1320px
```

---

## 📋 Funktionelle Umsetzung (Referenz)

### Was bereits funktioniert:

1. **MAG Module**
   - Anlagenvolumen, Temperaturen eingeben
   - Automatische Berechnung mit Sicherheitsventil-Prüfung
   - Result mit Empfehlung
   - Warnings für kritische Fälle

2. **Ventilation Module**
   - Modus: Volumenstrom / Leistung / Temperaturdifferenz
   - Heizen/Kühlen Toggle
   - Automatische Luftdichte-Berechnung
   - Ergebnisse: V, Q, dt, Massenstrom

### Was noch zu portieren ist:

3. **Entwaesserung** (entwaesserung.js)
   - DU-Auswahl (WC, Waschtisch, Dusche, etc.)
   - Gleichzeitigkeitsfaktor K
   - Strangliste mit Add/Edit/Delete
   - localStorage für Stranges
   - Pipe Dimensionierung

4. **WRG & Mischluft** (wrg-mischluft.js)
   - Wärmerückgewinnung (Plattenwärmetauscher)
   - Luftmischung (Massenströme)
   - Psychrometrische Berechnung
   - Kondensatprüfung

5. **Trinkwasser** (trinkwasser.js)
   - Bereitschaftsverluste
   - Speichergröße
   - Zirkulation

6. **Heating/Cooling** (hx-engine.js + heating-cooling.js)
   - Wärmetauscherberechnung
   - P-h Diagramm (Canvas)
   - Zustandsänderungen

---

## 🔧 Wichtigste Code Patterns

### State & Berechnung

```jsx
const [input1, setInput1] = useState('');
const [input2, setInput2] = useState('');
const [results, setResults] = useState(null);

const calculate = () => {
  const val1 = parseFloat(input1);
  const val2 = parseFloat(input2);
  if (isNaN(val1) || isNaN(val2)) return null;
  
  const result = {
    output1: val1 + val2,
    output2: val1 * val2,
  };
  setResults(result);
};

useEffect(() => {
  calculate();
}, [input1, input2]);
```

### Komponenten Struktur

```jsx
function MyModule() {
  return (
    <>
      {/* Linke Spalte: Inputs */}
      <div className="col-12 col-tablet-6">
        <Card title="Eingaben">
          <NumberInput {...} />
          <SelectInput {...} />
        </Card>
      </div>
      
      {/* Rechte Spalte: Ergebnisse */}
      <div className="col-12 col-tablet-6">
        <Card title="Ergebnisse">
          {results && <>
            <ResultRow {...} />
            <ResultRow {...} />
          </>}
        </Card>
      </div>
    </>
  );
}
```

### localStorage Nutzung

```jsx
// Save
useEffect(() => {
  localStorage.setItem('module-state', JSON.stringify(state));
}, [state]);

// Load
useEffect(() => {
  const saved = localStorage.getItem('module-state');
  if (saved) setState(JSON.parse(saved));
}, []);
```

---

## 📱 Responsive Verhalten

### Mobile (< 768px)

```
[Input Card]
[Result Card]
[Alert Box]
```

Volle Breite, stapelt sich vertikal.

### Tablet (768px - 1023px)

```
[Input]  [Results]
         
[Alert  Box]
```

50/50 Split, nebeneinander.

### Desktop (1024px+)

```
[Input]  [Results]  [Diagram]
         
[Alert Box]
```

Kann 3-spaltig sein, wenn nötig.

---

## ✅ Quality Checklist

Nach jedem Modul:

- [ ] Calculation logic works
- [ ] Mobile layout (390px)
- [ ] Tablet layout (768px)
- [ ] Desktop layout (1024px)
- [ ] Theme toggle works
- [ ] localStorage persistence (if needed)
- [ ] No console errors
- [ ] Accessibility: Color contrast > 4.5:1
- [ ] Touch targets: 44px minimum

---

## 📞 Support & Fragen

### Wenn Components nicht laden

→ Check import Pfade in App.jsx

### Wenn CSS nicht angewendet wird

→ Check CSS Import Reihenfolge in index.jsx  
→ tokens.css ZUERST, dann layout.css, dann components.css

### Wenn Berechnung falsch ist

→ Vergleichen mit Original JS Datei  
→ Parser-Funktion checken (isNaN, parseFloat)

### Wenn Responsive bricht

→ DevTools → Device Mode → Test alle Größen  
→ Container max-widths an Breakpoint checken

---

## 📊 Zusammenfassung der Verbesserungen

| Aspekt | Alt | Neu |
|--------|-----|-----|
| **Framework** | Vanilla JS | React 18 |
| **Build** | Manual | Vite |
| **Styling** | Mixed CSS | Design Tokens |
| **Layout** | Ad-hoc | 12-col Grid |
| **Responsive** | Limited | Mobile-first |
| **Components** | Monolithic | Reusable |
| **State** | Global + localStorage | React hooks |
| **Testing** | Manual | Easier |
| **Performance** | Good | Better (code-splitting) |
| **Maintainability** | Medium | High |

---

## 🎓 Learning Resources (empfohlen)

- React Official Tutorial: https://react.dev/learn
- CSS Grid: https://web.dev/learn/css/grid/
- Responsive Design: https://web.dev/responsive-web-design-basics/
- Design Tokens: https://www.designtokens.org/

---

## 📄 Lizenz & Attribution

TechCalc Pro v2 basiert auf der ursprünglichen TechCalc Pro App.  
Design System & React Architektur: Neuimplementierung 2026.

---

**Version**: 2.0  
**Status**: Ready to Build  
**Last Updated**: May 2026

Mit dieser Grundlage könnt ihr das Projekt schrittweise aufbauen und alle Module nacheinander portieren. Der Code ist gut strukturiert, die CSS ist modular und die Architektur ist scalable. Viel Erfolg! 🚀
