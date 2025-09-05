export const PROSODY_PRESETS = {
  balanced: {
    accentToVelocityFactor: 1.00,
    predelay: 0.07,
    cadenceSoftening: 0.35,
    phraseCurveStrength: 0.40,
    tenorBias: { pc: null, factor: 3 },
  },
  light: {
    accentToVelocityFactor: 0.85,
    predelay: 0.05,
    cadenceSoftening: 0.25,
    phraseCurveStrength: 0.25,
    tenorBias: { pc: null, factor: 2 },
  },
  solemn: {
    accentToVelocityFactor: 1.15,
    predelay: 0.09,
    cadenceSoftening: 0.50,
    phraseCurveStrength: 0.55,
    tenorBias: { pc: null, factor: 4 },
  },
  syllabic: {
    accentToVelocityFactor: 0.90,
    predelay: 0.04,
    cadenceSoftening: 0.20,
    phraseCurveStrength: 0.20,
    tenorBias: { pc: null, factor: 2 },
  },
};

export function resolveProsody(presetOrObj) {
  if (!presetOrObj) return { ...PROSODY_PRESETS.balanced };
  if (typeof presetOrObj === 'string') {
    return { ...PROSODY_PRESETS.balanced, ...(PROSODY_PRESETS[presetOrObj] || {}) };
  }
  return { ...PROSODY_PRESETS.balanced, ...presetOrObj };
}