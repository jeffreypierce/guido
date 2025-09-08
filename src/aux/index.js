/**
 * Normalize form code to 'EF' or 'OF'. Accepts legacy 'EF'/'1974' and case-insensitive.
 * @param {string} form
 * @returns {'EF'|'OF'}
 */
export function normalizeForm(form) {
  const s = String(form || "")
    .trim()
    .toUpperCase();
  if (s === "1962" || s === "EF") return "EF";
  if (s === "1974" || s === "OF") return "OF";
  return "EF";
}
/**
 * Normalize EF/OF season codes into generic buckets for selection logic.
 * @param {'ad'|'ct'|'lt'|'ea'|'ot'|'ot1'|'ot2'|'ap'|'sg'} seasonCode
 * @returns {'ad'|'ct'|'lt'|'ea'|'ot'}
 */
export function normalizeSeason(seasonCode) {
  switch (seasonCode) {
    case "ot2":
    case "ap":
    case "sg":
    case "ot1":
      return "ot";
    default:
      return seasonCode; // ad/ct/lt/ea/ot already fine
  }
}
/**
 * Clamp a number to the [0, 1] range.
 * @param {number} n
 * @returns {number}
 */
export const clamp = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Stable stringify for snapshot tests (sorts top-level keys).
 * @param {object} o
 * @returns {string}
 */
export const stableJson = (o) => JSON.stringify(o, Object.keys(o).sort(), 0);

/**
 * Normalize a Date-like value to a UTC-midnight Date.
 * @param {Date|string|number} x
 * @returns {Date}
 */
export function toUTC(x) {
  const d = x instanceof Date ? x : new Date(x);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

/** Convert a ratio to cents. */
export function toCent(ratio) {
  return 1200 * Math.log2(Number(ratio));
}

/** Convert cents to a ratio. */
export function fromCent(cents) {
  return 2 ** (Number(cents) / 1200);
}

/**
 * UTC-midnight timestamp (ms since epoch) for a given Date.
 * Use with Dates normalized via UTC getters.
 * @param {Date} d
 * @returns {number}
 */
export function tsUTC(d) {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Normalize a string: strip diacritics, lowercase.
 * @param {string} s
 * @returns {string}
 */
export function norm(s = "") {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Tokenize a string into simple alphanumeric tokens, normalized.
 * @param {string} s
 * @returns {string[]}
 */
export function tokens(s = "") {
  return norm(s)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Rotate an array by n steps (positive = left, negative = right).
 * Returns a new array; does not mutate input.
 * @param {any[]} arr
 * @param {number} n
 * @returns {any[]}
 */
export function rotate(arr, n) {
  const a = Array.isArray(arr) ? arr : [];
  if (!a.length) return a.slice();
  const k = ((Number(n) % a.length) + a.length) % a.length;
  return a.slice(k).concat(a.slice(0, k));
}

/**
 * Whether a season is penitential (Lent or Pre-Lent).
 * @param {string} season
 * @returns {boolean}
 */
export function isPenitential(season) {
  return season === "lt" || season === "sg";
}

/** Latin-friendly lowercase without diacritics */
// keep single implementation (ASCII diacritics range is broadly sufficient)

export function roman(v) {
  const validator =
    /^M*(?:D?C{0,3}|C[MD])(?:L?X{0,3}|X[CL])(?:V?I{0,3}|I[XV])$/;
  const tokens = /[MDLV]|C[MD]?|X[CL]?|I[XV]?/g;
  const lookup = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };

  // to roman numeral
  if (typeof v === "number") {
    let str = "";
    let i;
    for (i in lookup) {
      while (v >= lookup[i]) {
        str += i;
        v -= lookup[i];
      }
    }
    return str;
    // from roman numeral
  } else if (typeof v === "string") {
    let s = v.toUpperCase() ? v.toUpperCase() : undefined;
    let num = 0;
    let m;
    if (!(s && validator.test(s))) return;
    while ((m = tokens.exec(s))) num += lookup[m[0]];
    return num;
  } else {
    // fail
    return;
  }
}

export const round = (num, p = 3) =>
  Math.round((num + Number.EPSILON) * 10 ** p) / 10 ** p;
