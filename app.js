// ← Ganz oben in app.js einfügen!

window.$ = (id) => {
  const el = document.getElementById(id);
  if (!el) console.warn(`Element with ID "${id}" not found`);
  return el;
};

window.loc = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return '–';
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(num * factor) / factor;
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rounded);
};

window.parseNum = (str) => {
  if (!str) return 0;
  str = String(str).trim().replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

/**
 * TechCalc Pro - Clean App.js (Phase 3)
 * Only essential utilities - NO old modules!
 */

// ════════════════════════════════════════════════════════════════
// 1. GLOBAL HELPERS (needed by all modules)
// ════════════════════════════════════════════════════════════════

/**
 * Shorthand for document.getElementById
 */
window.$ = (id) => {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`⚠️  Element with ID "${id}" not found`);
  }
  return el;
};

/**
 * Number formatter with locale support
 * Examples:
 *   loc(123.456, 2) → "123.46"
 *   loc(1000.5, 1) → "1000.5"
 */
window.loc = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) {
    return '–';
  }
  
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(num * factor) / factor;
  
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rounded);
};

/**
 * Safe number parsing
 * Handles both . and , as decimal separator
 */
window.parseNum = (str) => {
  if (!str) return 0;
  str = String(str).trim().replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

// ════════════════════════════════════════════════════════════════
// 2. UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Get color based on value range
 */
window.colorForValue = (value, min = 0, max = 100) => {
  if (value < min) return '#4CAF50';      // Green
  if (value > max) return '#FF5252';      // Red
  return '#2196F3';                       // Blue
};

/**
 * Safe HTML escaping
 */
window.escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

// ════════════════════════════════════════════════════════════════
// 3. THEME MANAGEMENT (Light/Dark mode)
// ════════════════════════════════════════════════════════════════

window.getTheme = () => {
  const saved = localStorage.getItem('theme');
  if (saved) return saved;
  
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

window.setTheme = (theme) => {
  localStorage.setItem('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
};

// ════════════════════════════════════════════════════════════════
// 4. INITIALIZATION
// ════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // Set initial theme
  const theme = window.getTheme();
  window.setTheme(theme);
  
  console.log('✅ App.js initialized (clean version)');
  console.log('✅ window.$ available');
  console.log('✅ window.loc available');
  console.log('✅ window.parseNum available');
});

// ════════════════════════════════════════════════════════════════
// DONE! This file contains ONLY essential utilities.
// All modules (heating-cooling-v2.js, etc.) load AFTER this file.
// ════════════════════════════════════════════════════════════════
