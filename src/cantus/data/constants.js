// src/cantus/data/constants.js
// Keep data small, dependency-free, and immutable (frozen), mirroring festum style.

/** Labels for chant offices (short code → Latin label). */
export const OFFICE_LABELS = Object.freeze({
  an: "Antiphona",
  al: "Allelulia",
  ca: "Canticum",
  co: "Communio",
  gr: "Graduale",
  hy: "Hymnus",
  in: "Introitus",
  ky: "Kyriale",
  of: "Offertorium",
  ps: "Psalmus",
  re: "Responsorium",
  rb: "Responsorium breve",
  se: "Sequentia",
  tr: "Tractus",
  tp: "Tropa",
  or: "Toni Communes",
});

/** Labels for ordinary parts (short code → Latin label). */
export const ORDINARY_LABELS = Object.freeze({
  ky: "Kyrie eleison",
  gl: "Gloria",
  cr: "Credo",
  sa: "Sanctus",
  ag: "Agnus Dei",
  be: "Benedicamus",
  it: "Ite missa est",
});

/** Human label for an office code. */
export function officeLabel(code) {
  return OFFICE_LABELS[code] || code;
}

/** Human label for an ordinary code. */
export function ordinaryLabel(code) {
  return ORDINARY_LABELS[code] || code;
}
