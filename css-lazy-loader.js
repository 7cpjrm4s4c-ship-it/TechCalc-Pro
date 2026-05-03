/* ═══════════════════════════════════════════════════════
   css-lazy-loader.js — TechCalc Pro Phase 19
   Lazy-load module CSS without duplicate stylesheet requests.
═══════════════════════════════════════════════════════ */
'use strict';

(function(){
  const CSS_MODULES = {
    flow: 'hc.css',
    pipe: 'pipe.css',
    luft: 'ventilation.css',
    hx: 'hx.css',
    wrg: 'wrg.css',
    trinkwasser: 'trinkwasser.css',
    mag: 'mag.css',
    entwaesserung: 'entwaesserung.css'
  };

  const LOADED = new Set();
  const PENDING = new Map();

  function fileName(href){
    return (href || '').split('?')[0].split('#')[0].split('/').pop();
  }

  function markExisting(){
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      const href = fileName(link.getAttribute('href'));
      if (href) LOADED.add(href);
    });
    document.documentElement.dataset.cssLoaded = Array.from(LOADED).join(',');
  }

  function findLink(css){
    return Array.from(document.querySelectorAll('link[rel="stylesheet"],link[rel="preload"]'))
      .find(link => fileName(link.getAttribute('href')) === css);
  }

  function promotePreload(link, css){
    return new Promise(resolve => {
      const done = () => {
        LOADED.add(css);
        document.documentElement.dataset.cssLoaded = Array.from(LOADED).join(',');
        resolve(css);
      };

      if (link.rel === 'stylesheet') return done();

      link.onload = done;
      link.onerror = () => done();
      link.rel = 'stylesheet';
      link.removeAttribute('as');
      link.media = 'all';

      // If the preload has already completed, rel promotion applies synchronously in modern browsers.
      requestAnimationFrame(() => {
        if (!LOADED.has(css) && link.sheet) done();
      });
    });
  }

  function loadModuleCSS(moduleKey){
    const css = CSS_MODULES[moduleKey];
    if (!css || LOADED.has(css)) return Promise.resolve(css || moduleKey);
    if (PENDING.has(css)) return PENDING.get(css);

    const existing = findLink(css);
    if (existing) {
      const pending = promotePreload(existing, css).finally(() => PENDING.delete(css));
      PENDING.set(css, pending);
      return pending;
    }

    const pending = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = css;
      link.media = 'print';

      link.onload = () => {
        requestAnimationFrame(() => {
          link.media = 'all';
          LOADED.add(css);
          document.documentElement.dataset.cssLoaded = Array.from(LOADED).join(',');
          resolve(css);
        });
      };

      link.onerror = () => {
        console.error('[CSS Loader] Failed:', css);
        reject(new Error(css));
      };

      document.head.appendChild(link);
    }).finally(() => PENDING.delete(css));

    PENDING.set(css, pending);
    return pending;
  }

  function preloadAllModules(){
    const keys = Object.keys(CSS_MODULES).filter(k => k !== 'flow');
    keys.forEach((key, index) => {
      const run = () => loadModuleCSS(key).catch(() => {});
      if ('requestIdleCallback' in window) {
        requestIdleCallback(run, { timeout: 1500 + index * 250 });
      } else {
        setTimeout(run, 1500 + index * 250);
      }
    });
  }

  document.addEventListener('tab-change', event => {
    const key = event.detail && event.detail.tab;
    if (key) loadModuleCSS(key).catch(() => {});
  });

  document.addEventListener('click', event => {
    const tab = event.target && event.target.closest && event.target.closest('[data-tab]');
    if (tab && tab.dataset.tab) loadModuleCSS(tab.dataset.tab).catch(() => {});
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    markExisting();
    LOADED.add('hc.css');
    preloadAllModules();
  });

  window.LOAD_CSS = loadModuleCSS;
  window.TCP_CSS_MODULES = CSS_MODULES;
})();
