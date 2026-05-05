class ModuleRegistry {
  constructor(){ this.modules = new Map(); }
  register(id, config){ if(!id || this.modules.has(id)) throw new Error(`Module id ungültig oder doppelt: ${id}`); this.modules.set(id, { id, ...config }); }
  get(id){ return this.modules.get(id); }
  all(){ return [...this.modules.values()].sort((a,b)=>(a.order ?? 999)-(b.order ?? 999)); }
}
export const modules = new ModuleRegistry();
