function normalizeRDesignation(value = '') {
  const raw = String(value).trim();
  if (!raw) return '';
  if (raw.startsWith('R-')) return `R${raw.slice(2)}`;
  if (raw.startsWith('HFKW-')) return `R${raw.slice(5).replace(/\s+\(/g, '(')}`;
  return raw;
}

export function formatRefrigerantLabel(refrigerant = {}) {
  const designation = normalizeRDesignation(refrigerant.id);
  if (!designation) return refrigerant.name || '';
  if (refrigerant.regulatory?.fluorinatedGreenhouseGas === false && refrigerant.name) {
    return `${designation} (${refrigerant.name})`;
  }
  return designation;
}

export default formatRefrigerantLabel;
