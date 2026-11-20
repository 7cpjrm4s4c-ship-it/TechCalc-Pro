const numberOrNull = value => {
  if (value === '' || value == null) return null;
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const round = (value, digits = 3) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;

export function calculateDilutionOpeningArea({ chargeKg, roomVolumeM3, qlmvKgM3 } = {}) {
  const charge = numberOrNull(chargeKg);
  const volume = numberOrNull(roomVolumeM3);
  const qlmv = numberOrNull(qlmvKgM3);
  if (charge == null || charge <= 0 || volume == null || volume <= 0 || qlmv == null || qlmv <= 0) return null;
  return round((0.0032 * charge) / (qlmv * volume), 5);
}

export function calculateAlternativeMechanicalVentilationFlow({ rclKgM3 } = {}) {
  const rcl = numberOrNull(rclKgM3);
  if (rcl == null || rcl <= 0) return null;
  return round(10 / rcl, 1);
}

export const calculateSimplifiedMechanicalVentilationFlow = calculateAlternativeMechanicalVentilationFlow;

export default Object.freeze({
  calculateDilutionOpeningArea,
  calculateAlternativeMechanicalVentilationFlow,
  calculateSimplifiedMechanicalVentilationFlow
});
