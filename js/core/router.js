import { modules } from './registry.js';
let renderCallback = () => {};
export function initRouter(onRoute){ renderCallback = onRoute; window.addEventListener('hashchange', route); route(); }
export function navigate(id){ location.hash = id; }
export function currentRoute(){ const id = location.hash.replace('#',''); return modules.get(id) ? id : modules.all()[0]?.id; }
function route(){ const id = currentRoute(); if(location.hash.replace('#','') !== id) history.replaceState(null, '', `#${id}`); renderCallback(id); }
