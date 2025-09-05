// src/gabc/rules.js
// Centralized weights for Liber Usualis-style interpretation.
// Adjust these to tune ictus, episema, morae, etc.
export const defaultLiberRuleWeights = Object.freeze({
  // Accents & ictus
  ictusFactor: 1,
  ictusDuration: 0.25,
  breakAccentBoost: 1,
  // Phrase-initial emphasis
  groupBeginArsisBoost: 1,
  groupBeginIctusArsisBoost: 0.5,
  // Accented vowel (tictus)
  tictusArsisBoost: 0.5,
  // Initio debilis
  initioDebilisAttenuation: 2,
  // Morae
  moraFactor: 0.5,
  moraDuration: 1,
  // Liquescents
  liquescentAttenuation: 0.5,
  liquescentDurPenalty: 0.5,
  // Punctum inclinatum
  inclinatumPenalty: 1,
  inclinatumDurPenalty: 0.25,
  // Quilisma
  quilismaPrevBoost: 1,
  quilismaSelfPenalty: 0.5,
  // Pressus / repeated note
  pressusPrevDurAdd: 0.5,
  pressusPrevArsisAdd: 1,
  // Oriscus
  oriscusPrevArsisPenalty: 1,
});


export const WEIGHT_PROFILES = Object.freeze({
  liber1961: defaultLiberRuleWeights,
  semeiology: Object.freeze({
    // Slightly de-emphasize vertical ictus, emphasize text accents and liquescents
    ictusFactor: 0.5,
    ictusDuration: 0.2,
    breakAccentBoost: 1,
    groupBeginArsisBoost: 0.5,
    groupBeginIctusArsisBoost: 0.25,
    tictusArsisBoost: 0.75,
    initioDebilisAttenuation: 2,
    moraFactor: 0.5,
    moraDuration: 1,
    liquescentAttenuation: 0.25,
    liquescentDurPenalty: 0.25,
    inclinatumPenalty: 1,
    inclinatumDurPenalty: 0.25,
    quilismaPrevBoost: 1,
    quilismaSelfPenalty: 0.25,
    pressusPrevDurAdd: 0.5,
    pressusPrevArsisAdd: 0.75,
    oriscusPrevArsisPenalty: 0.5,
  })
});

export function _legacyResolveRubrics(profileOrObj) {
  if (!profileOrObj) return defaultLiberRuleWeights;
  if (typeof profileOrObj === 'string') {
    return WEIGHT_PROFILES[profileOrObj] || defaultLiberRuleWeights;
  }
  // assume a partial override object
  return Object.freeze({ ...defaultLiberRuleWeights, ...profileOrObj });
}
