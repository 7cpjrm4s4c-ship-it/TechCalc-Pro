# TechCalc Pro v2 — Setup & Configuration Guide

## 🚀 Quick Start (5 minutes)

### 1. Create React Project with Vite

```bash
npm create vite@latest techcalc-v2 -- --template react
cd techcalc-v2
npm install
```

### 2. Project Structure

```bash
# Create directories
mkdir -p src/components/layout
mkdir -p src/components/common
mkdir -p src/components/modules
mkdir -p src/components/diagrams
mkdir -p src/styles
mkdir -p src/utils
mkdir -p src/hooks

# Copy design system
cp tokens.css src/styles/
cp layout.css src/styles/
cp components.css src/styles/
```

### 3. Update index.jsx

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/tokens.css'
import './styles/layout.css'
import './styles/components.css'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 4. Update index.html

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/icon-192.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="HLK-Rechner für Heizung, Lüftung, Klimatisierung">
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/icon-180.png" />
    <title>TechCalc Pro — HLK-Rechner</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### 5. Copy React Component Code

- Copy `TechCalcPro-v2-React.jsx` content to `src/App.jsx`
- Adjust imports/exports as needed

### 6. Run Development Server

```bash
npm run dev
```

Open: http://localhost:5173

---

## 📋 File: vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
        },
      },
    },
  },
})
```

---

## 📋 File: package.json

```json
{
  "name": "techcalc-v2",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "format": "prettier --write src/",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.2.1",
    "prettier": "^3.0.3",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

---

## 📋 File: .env.example

```
# Environment Variables
VITE_APP_VERSION=2.0.0
VITE_API_BASE_URL=https://api.example.com
```

---

## 📋 File: public/manifest.json

```json
{
  "name": "TechCalc Pro",
  "short_name": "TechCalc",
  "description": "HLK-Rechner für Heizung, Lüftung und Klimatisierung",
  "display": "standalone",
  "orientation": "portrait-primary",
  "start_url": "/",
  "scope": "/",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["utilities", "productivity"],
  "screenshots": [
    {
      "src": "/screenshot-1.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshot-2.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ]
}
```

---

## 📋 File: public/sw.js (Updated for React)

```javascript
/* ═══════════════════════════════════════════════════════════
   TechCalc Pro v2 — Service Worker
   React build with Vite
═══════════════════════════════════════════════════════════ */
'use strict';

const BUILD_TS = '20260503-v2-react';
const CACHE_NAME = `techcalc-${BUILD_TS}`;

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  // These will be replaced with actual build artifacts
  // Use a build script to inject these:
  // './assets/main.*.js',
  // './assets/main.*.css',
];

const BYPASS = ['workers.dev', 'analytics', 'cloudflare'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      await cache.addAll(PRECACHE);
    } catch (e) {
      console.warn('Some assets failed to cache:', e);
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return;
  if (url.origin !== self.location.origin) return;
  if (BYPASS.some(b => url.hostname.includes(b))) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    const network = fetch(request).then(response => {
      if (response && response.status === 200 && response.type !== 'opaque') {
        cache.put(request, response.clone());
      }
      return response;
    }).catch(() => null);

    if (cached) {
      network.catch(() => null);
      return cached;
    }

    const fresh = await network;
    if (fresh) return fresh;
    if (request.mode === 'navigate') return cache.match('./index.html');
    return new Response('', { status: 408, statusText: 'Offline cache miss' });
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
```

---

## 🔄 Build & Deploy

### Build for Production

```bash
npm run build

# Output: dist/
# Ready to deploy to:
# - GitHub Pages
# - Vercel
# - Netlify
# - Any static host
```

### Deploy to GitHub Pages

```bash
# 1. Update vite.config.js
export default {
  base: '/techcalc-v2/',  # if repo is not root
}

# 2. Build
npm run build

# 3. Deploy
git add dist/
git commit -m "Build production"
git push

# 4. GitHub Pages settings:
# Settings > Pages > Source > Deploy from branch (main, /dist)
```

### Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Follow prompts
```

---

## 🧪 Testing Responsive Design

### Chrome DevTools

1. Press `F12`
2. Click device toggle (top-left)
3. Test breakpoints:
   - iPhone 12 (390px)
   - iPad (768px)
   - Desktop (1024px+)

### Responsive Test Sizes

```
Mobile:     390px (iPhone)
Tablet:     768px (iPad)
Desktop:    1024px
Wide:       1440px (2K)
```

### Testing Checklist

```
✓ Mobile (390px)
  - Stack vertically
  - Single column inputs
  - Touch targets 44px+
  
✓ Tablet (768px)
  - 2-column layout
  - Inputs left, results right
  - Readable text
  
✓ Desktop (1024px+)
  - Full side-by-side
  - Hover effects
  - Optimal reading width
```

---

## 🎨 Customizing Design

### Change Primary Color

Edit `src/styles/tokens.css`:

```css
/* From blue (5b52ff) to your color */
--color-primary: #your-hex;

/* Update button & links */
.button-primary {
  background: linear-gradient(135deg, var(--color-primary), lighter-shade);
}
```

### Change Theme Colors

```css
--color-heat: #ff6b35;    /* Heating */
--color-cold: #00c4e8;    /* Cooling */
--color-air: #a78bfa;     /* Ventilation */
--color-ok: #34d399;      /* Success */
```

### Adjust Spacing Scale

```css
/* From 8px base to 10px base */
--space-xs: 5px;
--space-sm: 10px;
--space-md: 20px;
--space-lg: 30px;
/* etc. */
```

---

## 🐛 Troubleshooting

### Module not found error

```bash
# Check file paths
# React components use PascalCase
# Files use kebab-case or PascalCase consistently

# Example:
src/components/modules/MagModule.jsx
import MagModule from './modules/MagModule'
```

### CSS not loading

```javascript
// Ensure import order in index.jsx
import './styles/tokens.css'
import './styles/layout.css'
import './styles/components.css'
```

### Responsive layout breaking

```css
/* Check container max-width at each breakpoint */
@media (min-width: 768px) {
  .container {
    max-width: 748px;  /* Tablet */
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1000px; /* Desktop */
  }
}
```

### Performance issues

```javascript
// Lazy load modules
import { lazy, Suspense } from 'react'

const MagModule = lazy(() => import('./modules/MagModule'))

// Use Suspense
<Suspense fallback={<div>Loading...</div>}>
  <MagModule />
</Suspense>
```

---

## 📚 Additional Resources

- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev
- **CSS Grid**: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout
- **CSS Variables**: https://developer.mozilla.org/en-US/docs/Web/CSS/--*

---

## ✅ Checklist für Go-Live

- [ ] All modules ported and tested
- [ ] Responsive design at 3 breakpoints
- [ ] Dark & light theme working
- [ ] localStorage persistence working
- [ ] Service Worker caching assets
- [ ] PWA installable
- [ ] PDF export working (or marked as TODO)
- [ ] No console errors
- [ ] Performance > 90 (Lighthouse)
- [ ] Accessibility > 90 (Lighthouse)
- [ ] Built and deployed

---

**Version**: 2.0  
**Last Updated**: May 2026  
**Framework**: React 18 + Vite  
**CSS**: Pure CSS with Design Tokens
