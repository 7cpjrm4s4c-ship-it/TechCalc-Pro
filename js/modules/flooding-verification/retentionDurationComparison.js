const finite = value => Number.isFinite(Number(value)) ? Number(value) : null;

const STATUS_LABELS = Object.freeze({
  invalid: 'ungültig',
  'clamped-to-zero': 'auf 0 m³ begrenzt',
  valid: 'gültig',
  governing: 'maßgebend'
});

export function buildRetentionDurationComparison(durationResults = []) {
  const normalized = (Array.isArray(durationResults) ? durationResults : [])
    .map(item => ({
      ...item,
      durationMinutes: finite(item?.durationMinutes),
      rainIntensityLsHa: finite(item?.rainIntensityLsHa),
      throttleRainShareLsHa: finite(item?.throttleRainShareLsHa),
      surchargeFactorFz: finite(item?.surchargeFactorFz),
      reductionFactorFa: finite(item?.reductionFactorFa),
      specificStorageM3Ha: finite(item?.specificStorageM3Ha),
      volumeM3: finite(item?.volumeM3),
      valid: item?.valid === true && finite(item?.durationMinutes) > 0 && finite(item?.volumeM3) !== null
    }))
    .filter(item => item.durationMinutes > 0)
    .sort((a, b) => a.durationMinutes - b.durationMinutes);

  const validByVolume = normalized
    .filter(item => item.valid)
    .sort((a, b) => b.volumeM3 - a.volumeM3 || a.durationMinutes - b.durationMinutes);
  const governing = validByVolume[0] || null;
  const rankByDuration = new Map(validByVolume.map((item, index) => [item.durationMinutes, index + 1]));

  const rows = normalized.map(item => {
    const isGoverning = Boolean(governing && item.valid && item.durationMinutes === governing.durationMinutes && item.volumeM3 === governing.volumeM3);
    const status = !item.valid
      ? 'invalid'
      : item.clampedToZero
        ? 'clamped-to-zero'
        : isGoverning
          ? 'governing'
          : 'valid';
    return Object.freeze({
      ...item,
      rank: item.valid ? rankByDuration.get(item.durationMinutes) : null,
      isGoverning,
      differenceToMaximumM3: item.valid && governing ? governing.volumeM3 - item.volumeM3 : null,
      status,
      statusLabel: STATUS_LABELS[status]
    });
  });

  const diagnostics = [
    ...rows.filter(item => item.status === 'invalid').map(item => Object.freeze({ severity: 'error', text: `Die Dauerstufe ${item.durationMinutes} min ist unvollständig oder ungültig.` })),
    ...rows.filter(item => item.status === 'clamped-to-zero').map(item => Object.freeze({ severity: 'warning', text: `Die Dauerstufe ${item.durationMinutes} min ergab einen negativen Rohwert und wurde auf 0 m³ begrenzt.` }))
  ];

  return Object.freeze({
    calculated: Boolean(governing),
    durationCount: rows.length,
    validDurationCount: validByVolume.length,
    rows: Object.freeze(rows),
    governing: governing ? Object.freeze({
      durationMinutes: governing.durationMinutes,
      rainIntensityLsHa: governing.rainIntensityLsHa,
      throttleRainShareLsHa: governing.throttleRainShareLsHa,
      surchargeFactorFz: governing.surchargeFactorFz,
      reductionFactorFa: governing.reductionFactorFa,
      specificStorageM3Ha: governing.specificStorageM3Ha,
      volumeM3: governing.volumeM3,
      status: 'governing',
      statusLabel: STATUS_LABELS.governing
    }) : null,
    diagnostics: Object.freeze(diagnostics),
    messages: Object.freeze(diagnostics.map(item => item.text))
  });
}

export default buildRetentionDurationComparison;
