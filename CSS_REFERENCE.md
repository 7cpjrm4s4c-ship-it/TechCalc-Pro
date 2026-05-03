# 🎨 TechCalc Pro v2 — CSS Class Reference

Schnelle Übersicht aller CSS Klassen für die Komponenten-Entwicklung.

---

## 📐 Layout & Grid

### Container

```html
<div class="container">
  <!-- 12-column grid with responsive padding -->
  <!-- Automatically handles breakpoints -->
</div>
```

### Grid Columns

```html
<!-- Full width on all screens -->
<div class="col-12">...</div>

<!-- 6 columns (half) on mobile -->
<div class="col-6">...</div>

<!-- Tablet-specific (768px+) -->
<div class="col-12 col-tablet-6">Half on tablet+</div>

<!-- Desktop-specific (1024px+) -->
<div class="col-12 col-desktop-8">8/12 columns on desktop</div>
```

---

## 🎯 Flexbox Utilities

```html
<!-- Display flex -->
<div class="flex">...</div>
<div class="flex-col">Vertical stack</div>
<div class="flex-row">Horizontal</div>
<div class="flex-center">Centered</div>
<div class="flex-between">Space between</div>

<!-- Gap -->
<div class="flex gap-sm">...</div>
<div class="flex gap-md">...</div>
<div class="flex gap-lg">...</div>

<!-- Alignment -->
<div class="items-start">...</div>
<div class="items-center">...</div>
<div class="items-end">...</div>

<!-- Justify -->
<div class="justify-start">...</div>
<div class="justify-center">...</div>
<div class="justify-between">...</div>
```

---

## 📏 Spacing Utilities

### Padding

```html
<div class="p-sm">All sides</div>
<div class="p-md">All sides</div>
<div class="p-lg">All sides</div>
<div class="p-xl">All sides</div>

<div class="px-md">Horizontal only</div>
<div class="py-lg">Vertical only</div>
```

### Margin

```html
<div class="m-sm">All sides</div>
<div class="mt-md">Top only</div>
<div class="mb-lg">Bottom only</div>
<div class="ml-sm">Left only</div>
<div class="mr-sm">Right only</div>
```

---

## 🎨 Cards

### Basic Card

```html
<div class="card">
  <h2 class="card-title">Title</h2>
  <div class="card-body">
    <!-- Content -->
  </div>
</div>
```

### Result Card (green tint)

```html
<div class="card" style="background: radial-gradient(...)">
  <h2 class="card-title">Results</h2>
  <div class="card-body">
    <div class="result-row">
      <div class="result-label">Label</div>
      <div class="result-value">123.45</div>
    </div>
  </div>
</div>
```

---

## 🔘 Buttons

### Variants

```html
<!-- Primary (blue gradient) -->
<button class="button button-primary">Click me</button>

<!-- Secondary (glass) -->
<button class="button button-secondary">Cancel</button>

<!-- Ghost (outline) -->
<button class="button button-ghost">Remove</button>

<!-- Danger (red) -->
<button class="button button-danger">Delete</button>

<!-- Success (green) -->
<button class="button button-success">Save</button>
```

### Sizes

```html
<button class="button button-sm">Small</button>
<button class="button">Medium (default)</button>
<button class="button button-lg">Large</button>
```

### Full Width

```html
<button class="button button-primary button-full">Full Width</button>
```

### Disabled State

```html
<button class="button" disabled>Disabled</button>
```

---

## 📝 Form Elements

### Input Group (label + input + hint)

```html
<div class="input-group">
  <label class="input-label">Email Address</label>
  <input type="email" class="input" placeholder="you@example.com" />
  <div class="input-hint">We'll never share your email</div>
</div>
```

### Number Input

```html
<div class="input-group">
  <label class="input-label">Temperature</label>
  <input type="number" class="input" min="0" max="100" />
</div>
```

### Select Dropdown

```html
<div class="input-group">
  <label class="input-label">System Type</label>
  <select class="select">
    <option>Heating</option>
    <option>Cooling</option>
  </select>
</div>
```

### Input with Error

```html
<div class="input-group">
  <label class="input-label">Value</label>
  <input type="number" class="input has-error" />
  <div class="input-error">Must be positive</div>
</div>
```

---

## 📊 Result Display

### Single Result Row

```html
<div class="result-row">
  <div class="result-label">Total Volume</div>
  <div>
    <span class="result-value">123.45</span>
    <span class="result-unit">l</span>
  </div>
</div>
```

### Multiple Results in Card

```html
<div class="card">
  <h2 class="card-title">Calculation Results</h2>
  <div class="card-body">
    <div class="result-row">
      <div class="result-label">Output 1</div>
      <span class="result-value">100.00</span>
    </div>
    <div class="result-row">
      <div class="result-label">Output 2</div>
      <span class="result-value">200.00</span>
    </div>
    <div class="result-row">
      <div class="result-label">Total</div>
      <span class="result-value" style="color: var(--color-ok)">300.00</span>
    </div>
  </div>
</div>
```

---

## 🏷️ Badges

### Standard Badges

```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-danger">Error</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-warn">Warning</span>
<span class="badge badge-heat">🔥 Heating</span>
<span class="badge badge-cold">❄️ Cooling</span>
```

---

## ⚠️ Alerts & Messages

### Error Alert

```html
<div class="alert alert-error">
  ⚠️ This value exceeds the maximum allowed
</div>
```

### Warning Alert

```html
<div class="alert alert-warn">
  ⚡ Check your input values before calculating
</div>
```

### Success Alert

```html
<div class="alert alert-success">
  ✓ Calculation completed successfully
</div>
```

---

## 📑 Tabs

### Tab Navigation

```html
<div class="tabs">
  <button class="tab active">Tab 1</button>
  <button class="tab">Tab 2</button>
  <button class="tab">Tab 3</button>
</div>
```

---

## 🔤 Typography

### Font Sizes

```html
<div class="text-xs">Extra Small (11px)</div>
<div class="text-sm">Small (13px)</div>
<div class="text-base">Base (15px)</div>
<div class="text-lg">Large (17px)</div>
<div class="text-xl">Extra Large (20px)</div>
<div class="text-2xl">2XL (24px)</div>
<div class="text-3xl">3XL (28px)</div>
```

### Font Weights

```html
<div class="font-light">Light (300)</div>
<div class="font-normal">Normal (400)</div>
<div class="font-medium">Medium (500)</div>
<div class="font-semibold">Semibold (600)</div>
<div class="font-bold">Bold (700)</div>
<div class="font-black">Black (900)</div>
```

### Text Colors

```html
<div class="text-primary">Primary text</div>
<div class="text-secondary">Secondary text</div>
<div class="text-tertiary">Tertiary text</div>
<div class="text-disabled">Disabled text</div>

<div class="text-heat">Heat color</div>
<div class="text-cold">Cold color</div>
<div class="text-air">Air color</div>
<div class="text-ok">Success color</div>
<div class="text-warn">Warning color</div>
<div class="text-danger">Danger color</div>
```

### Text Alignment

```html
<div class="text-left">Left aligned</div>
<div class="text-center">Centered</div>
<div class="text-right">Right aligned</div>
<div class="truncate">Text overflow ellipsis...</div>
```

---

## 👁️ Visibility

### Hide/Show

```html
<!-- Always hidden -->
<div class="hidden">Hidden</div>

<!-- Hidden on mobile only -->
<div class="hidden-mobile">Visible on tablet+</div>

<!-- Hidden on tablet only -->
<div class="hidden-tablet">Visible on mobile and desktop</div>

<!-- Hidden on desktop only -->
<div class="hidden-desktop">Visible on mobile and tablet</div>

<!-- Show only on tablet and up -->
<div class="visible-tablet-up">Tablet and desktop only</div>
```

---

## 🎯 Common Patterns

### Module Layout (Input + Results side-by-side)

```jsx
<>
  {/* Left column: Inputs */}
  <div className="col-12 col-tablet-6">
    <Card title="Inputs">
      <NumberInput label="Volume" {...} />
      <NumberInput label="Temperature" {...} />
    </Card>
  </div>
  
  {/* Right column: Results */}
  <div className="col-12 col-tablet-6">
    <Card title="Results">
      <ResultRow label="Expansion Volume" value={123} unit="l" />
      <ResultRow label="Pressure" value={3.5} unit="bar" />
    </Card>
  </div>
</>
```

### Alert Box with Multiple Lines

```html
<div class="alert alert-warn">
  <div>⚡ Critical values detected:</div>
  <div style="margin-top: var(--space-sm)">
    • Pressure exceeds safety valve setting
  </div>
  <div style="margin-top: var(--space-xs)">
    • Check system configuration
  </div>
</div>
```

### Form with Input Grid

```html
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--gap-lg)">
  <div class="input-group">
    <label class="input-label">Field 1</label>
    <input type="number" class="input" />
  </div>
  <div class="input-group">
    <label class="input-label">Field 2</label>
    <input type="number" class="input" />
  </div>
  <div class="input-group">
    <label class="input-label">Field 3</label>
    <input type="number" class="input" />
  </div>
</div>
```

---

## 🎨 Using CSS Variables

### Direct access to tokens

```css
/* In your component CSS */
.my-component {
  color: var(--color-text-primary);
  background: var(--color-bg-secondary);
  padding: var(--pad-lg);
  gap: var(--gap-md);
  font-size: var(--text-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

### Common Combinations

```css
/* Colored text with semantic meaning */
.heat-text { color: var(--color-heat); }
.cold-text { color: var(--color-cold); }
.success-text { color: var(--color-ok); }

/* Glass effect background */
.glass-panel {
  background: var(--color-glass-mid);
  border: 1px solid var(--color-border-soft);
  backdrop-filter: blur(10px);
}

/* Spacing */
.spaced { margin: var(--space-lg); padding: var(--pad-md); }

/* Typography heading -->
.heading {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
```

---

## 📱 Responsive Examples

### Show Different Content by Breakpoint

```html
<!-- Desktop: 3-column layout -->
<div class="hidden-mobile hidden-tablet">
  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr">
    <!-- 3 columns -->
  </div>
</div>

<!-- Tablet: 2-column layout -->
<div class="hidden-mobile" style="display: none">
  <div style="display: grid; grid-template-columns: 1fr 1fr">
    <!-- 2 columns -->
  </div>
</div>

<!-- Mobile: 1-column stack -->
<div class="hidden-tablet hidden-desktop">
  <div style="display: flex; flex-direction: column">
    <!-- Stacked -->
  </div>
</div>
```

---

## 🔗 Design Tokens Quick Reference

### Spacing Values
- `--space-xs`: 4px
- `--space-sm`: 8px
- `--space-md`: 16px
- `--space-lg`: 24px
- `--space-xl`: 32px

### Text Sizes
- `--text-xs`: 11px
- `--text-sm`: 13px
- `--text-base`: 15px
- `--text-lg`: 17px
- `--text-xl`: 20px
- `--text-2xl`: 24px

### Colors (Dark Mode)
- `--color-heat`: #ff6b35
- `--color-cold`: #00c4e8
- `--color-air`: #a78bfa
- `--color-ok`: #34d399
- `--color-warn`: #fbbf24
- `--color-danger`: #ff453a

### Radii
- `--radius-xs`: 4px
- `--radius-sm`: 8px
- `--radius-md`: 12px
- `--radius-lg`: 16px
- `--radius-xl`: 20px

---

**Version**: 2.0 Reference  
**Last Updated**: May 2026

Diese Übersicht sollte beim schnellen Referenzieren helfen. Für ausführliche Erklärungen siehe DOCUMENTATION.md!
