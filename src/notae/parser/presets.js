// src/presets.js
// Expressive shaping presets for chant playback.

export const SHAPE_PRESETS = Object.freeze({
  "psalm-tone": Object.freeze({
    // very gentle shaping; mostly steady reciting
    phraseArch: 2,
    pitchHeightWeight: 1,
    arsisWeight: 4,
    ictusWeight: 2,
    divisioProfiles: {
      "`": {
        breathFactor: 0.4,
        cadenceDim: 0.03,
        cadenceRit: 0.01,
        cadenceNotes: 1,
      },
      ",": {
        breathFactor: 0.5,
        cadenceDim: 0.06,
        cadenceRit: 0.02,
        cadenceNotes: 1,
      },
      ";": {
        breathFactor: 0.6,
        cadenceDim: 0.1,
        cadenceRit: 0.03,
        cadenceNotes: 2,
      },
      ":": {
        breathFactor: 0.7,
        cadenceDim: 0.14,
        cadenceRit: 0.04,
        cadenceNotes: 2,
      },
      "::": {
        breathFactor: 0.9,
        cadenceDim: 0.18,
        cadenceRit: 0.06,
        cadenceNotes: 3,
      },
      default: {
        breathFactor: 0.5,
        cadenceDim: 0.0,
        cadenceRit: 0.0,
        cadenceNotes: 0,
      },
    },
    tenorBias: { weight: 2 },
    humanize: { timingJitter: 0.01, velocityJitter: 1, seed: 1312 },
    velocityClamp: [52, 90],
  }),

  lyrical: Object.freeze({
    // more expressive arch and cadences
    phraseArch: 10,
    pitchHeightWeight: 5,
    arsisWeight: 6,
    ictusWeight: 3,
    divisioProfiles: {
      "`": {
        breathFactor: 0.5,
        cadenceDim: 0.05,
        cadenceRit: 0.02,
        cadenceNotes: 1,
      },
      ",": {
        breathFactor: 0.6,
        cadenceDim: 0.1,
        cadenceRit: 0.04,
        cadenceNotes: 2,
      },
      ";": {
        breathFactor: 0.8,
        cadenceDim: 0.18,
        cadenceRit: 0.06,
        cadenceNotes: 3,
      },
      ":": {
        breathFactor: 0.9,
        cadenceDim: 0.24,
        cadenceRit: 0.08,
        cadenceNotes: 3,
      },
      "::": {
        breathFactor: 1.2,
        cadenceDim: 0.32,
        cadenceRit: 0.1,
        cadenceNotes: 4,
      },
      default: {
        breathFactor: 0.6,
        cadenceDim: 0.0,
        cadenceRit: 0.0,
        cadenceNotes: 0,
      },
    },
    tenorBias: { weight: 4 },
    humanize: { timingJitter: 0.03, velocityJitter: 2, seed: 2025 },
    velocityClamp: [50, 100],
  }),
});

export const PROSODY_PRESETS = {
  balanced: {
    accentToVelocityFactor: 1.0,
    predelay: 0.07,
    cadenceSoftening: 0.35,
    phraseCurveStrength: 0.4,
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
    cadenceSoftening: 0.5,
    phraseCurveStrength: 0.55,
    tenorBias: { pc: null, factor: 4 },
  },
  syllabic: {
    accentToVelocityFactor: 0.9,
    predelay: 0.04,
    cadenceSoftening: 0.2,
    phraseCurveStrength: 0.2,
    tenorBias: { pc: null, factor: 2 },
  },
};

export function resolveProsody(presetOrObj) {
  if (!presetOrObj) return { ...PROSODY_PRESETS.balanced };
  if (typeof presetOrObj === "string") {
    return {
      ...PROSODY_PRESETS.balanced,
      ...(PROSODY_PRESETS[presetOrObj] || {}),
    };
  }
  return { ...PROSODY_PRESETS.balanced, ...presetOrObj };
}
