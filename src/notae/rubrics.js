/*
  rubrics.js — canonical chant interpretation weights (formerly "liber" rules)
*/
export const defaultRubricWeights = {
  ictusFactor: 1.00,
  moraFactor: 0.50,
  initioDebilisAttenuation: 2.0,
  liquescentAttenuation: 0.50,
  punctumInclinatumAttenuation: 1.00,
  oriscusAttenuation: 1.00,
  ictusDuration: 0.25,
  moraDuration: 1.00,
  pressusDuration: 0.50,
  pressusOffset: 1.00,
};

export const RUBRIC_PROFILES = {
  balanced: { ...defaultRubricWeights },
  light: {
    ...defaultRubricWeights,
    ictusFactor: 0.50,
    ictusDuration: 0.15,
    moraFactor: 0.25,
    moraDuration: 0.75,
    initioDebilisAttenuation: 1.5,
    punctumInclinatumAttenuation: 0.5,
    liquescentAttenuation: 0.25,
    pressusDuration: 0.40,
    pressusOffset: 0.80,
    oriscusAttenuation: 0.50,
  },
  solemn: {
    ...defaultRubricWeights,
    ictusFactor: 1.20,
    ictusDuration: 0.33,
    moraFactor: 0.75,
    moraDuration: 1.25,
    initioDebilisAttenuation: 2.2,
    punctumInclinatumAttenuation: 1.1,
    liquescentAttenuation: 0.60,
    pressusDuration: 0.60,
    pressusOffset: 1.20,
  },
  syllabic: {
    ...defaultRubricWeights,
    ictusFactor: 0.80,
    ictusDuration: 0.20,
    moraFactor: 0.40,
    moraDuration: 0.80,
    initioDebilisAttenuation: 1.8,
    punctumInclinatumAttenuation: 0.8,
    liquescentAttenuation: 0.40,
    pressusDuration: 0.50,
    pressusOffset: 1.00,
    oriscusAttenuation: 0.80,
  },
  liber1961: { ...defaultRubricWeights },
};

export function _legacyResolveRubrics(presetOrObj) {
  if (!presetOrObj) return { ...defaultRubricWeights };
  if (typeof presetOrObj === 'string') {
    return { ...defaultRubricWeights, ...(RUBRIC_PROFILES[presetOrObj] || {}) };
  }
  return { ...defaultRubricWeights, ...presetOrObj };
}