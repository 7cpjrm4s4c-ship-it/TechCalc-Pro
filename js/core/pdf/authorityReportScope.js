export function isAuthorityDischargeLimited(dto = {}) {
  return dto.hydraulics?.dischargeMode === 'authority-discharge-limit';
}

export function isDwaVerificationRequired(dto = {}) {
  return isAuthorityDischargeLimited(dto);
}

export default isDwaVerificationRequired;
