function normalizeRDesignation(value = '') {
  const raw = String(value).trim();
  if (!raw) return '';
  if (raw.startsWith('R-')) return `R${raw.slice(2)}`;
  if (raw.startsWith('HFKW-')) return `R${raw.slice(5).replace(/\s+\(/g, '(')}`;
  return raw;
}

export function formatRefrigerantLabel(refrigerant = {}) {
  const item = refrigerant && typeof refrigerant === 'object' ? refrigerant : {};
  const designation = normalizeRDesignation(item.id);
  if (!designation) return item.name || '';
  if (item.regulatory?.fluorinatedGreenhouseGas === false && item.name) {
    return `${designation} (${item.name})`;
  }
  return designation;
}

export default formatRefrigerantLabel;
