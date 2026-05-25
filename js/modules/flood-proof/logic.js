export const toNumber = value => {
  const n = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
};

export function calculate(input = {}) {
  const duration = Math.max(0, toNumber(input.rainDuration || '5'));
  const r30 = Math.max(0, toNumber(input.rainThirty));
  const r2 = Math.max(0, toNumber(input.rainTwo));
  const roofArea = Math.max(0, toNumber(input.roofArea));
  const roofCs = Math.max(0, toNumber(input.roofCs));
  const pavedArea = Math.max(0, toNumber(input.pavedArea));
  const pavedCs = Math.max(0, toNumber(input.pavedCs));
  const explicitTotal = Math.max(0, toNumber(input.totalImperviousArea));
  const totalArea = explicitTotal > 0 ? explicitTotal : roofArea + pavedArea;
  const existingVolume = Math.max(0, toNumber(input.existingVolume));
  const allowedDischarge = Math.max(0, toNumber(input.allowedDischarge));
  const drainableDischarge = Math.max(0, toNumber(input.drainableDischarge));

  const referenceRainVolume = r30 * totalArea;
  const designDischargeVolume = (r2 * roofArea * roofCs) + (r2 * pavedArea * pavedCs);
  const volumeDin = Math.max(0, (referenceRainVolume - designDischargeVolume) * duration * 60 / 10000 / 1000);
  const dischargeRelief = Math.max(allowedDischarge, drainableDischarge) * duration * 60 / 1000;
  const requiredVolume = Math.max(0, volumeDin - dischargeRelief);
  const reserve = existingVolume - requiredVolume;
  const fulfilled = requiredVolume > 0 && existingVolume >= requiredVolume;

  const qThirty = r30 * totalArea / 10000;
  const qTwoRoof = r2 * roofArea * roofCs / 10000;
  const qTwoPaved = r2 * pavedArea * pavedCs / 10000;
  const qTwo = qTwoRoof + qTwoPaved;

  const warnings = [
    'Normgrundlage: Berechnung erfolgt auf Grundlage der DIN 1986-100, aktuellste Fassung.',
    'Hinweis: Hauptentwässerung und Notentwässerung werden im Modul Regenwasser separat ausgelegt.'
  ];
  if (totalArea <= 0) warnings.push('Hinweis: Es ist noch keine abflusswirksame Fläche angegeben.');
  if (r30 <= 0 || r2 <= 0) warnings.push('Hinweis: Regenspenden r(D,30) und r(D,2) standortbezogen über KOSTRA/OpenKo eintragen.');
  if (duration <= 0) warnings.push('Hinweis: Regendauer D prüfen.');
  if (existingVolume <= 0) warnings.push('Hinweis: Vorhandenes Rückhaltevolumen eintragen, um den Nachweis bewerten zu können.');
  if (requiredVolume <= 0 && totalArea > 0 && r30 > 0 && r2 > 0) warnings.push('Hinweis: Erforderliches Rückhaltevolumen ist 0 m³. Eingaben und Flächenansatz plausibilisieren.');

  return {
    duration,
    r30,
    r2,
    roofArea,
    roofCs,
    pavedArea,
    pavedCs,
    totalArea,
    existingVolume,
    allowedDischarge,
    drainableDischarge,
    qThirty: round(qThirty, 2),
    qTwoRoof: round(qTwoRoof, 2),
    qTwoPaved: round(qTwoPaved, 2),
    qTwo: round(qTwo, 2),
    volumeDin: round(volumeDin, 2),
    dischargeRelief: round(dischargeRelief, 2),
    requiredVolume: round(requiredVolume, 2),
    reserve: round(reserve, 2),
    fulfilled,
    warnings
  };
}
