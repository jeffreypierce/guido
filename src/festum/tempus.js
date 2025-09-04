// src/festum/tempus.js
import { toUTC } from "../aux/aux.js";
const tUTC = (d) =>
  Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
const betweenInc = (x, a, b) => x >= a && x <= b;
const before = (x, a) => x < a;
const onOrAfter = (x, a) => x >= a;

/**
 * Normalize EF/OF season codes into generic buckets for selection logic.
 * @param {'ad'|'ct'|'lt'|'ea'|'ot'|'ot1'|'ot2'|'ap'|'sg'} seasonCode
 * @returns {'ad'|'ct'|'lt'|'ea'|'ot'}
 */
export function seasonNormalize(seasonCode) {
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
 * EF season classifier.
 * @param {Date|string|number} date - Date-like value; coerced to UTC.
 * @param {import('./datum.js').Landmarks1962} L - Landmarks lookup.
 * @returns {'ad'|'ct'|'ot2'|'sg'|'lt'|'ea'|'ap'}
 */
export function season1962(date, L) {
  const d = toUTC(date);
  const A = tUTC(toUTC(L.advent_sunday));
  const C = tUTC(toUTC(L.christmas));
  const BP = tUTC(toUTC(L.baptism));
  const SG = tUTC(toUTC(L.septuagesima));
  const ASH = tUTC(toUTC(L.ash_wednesday));
  const E = tUTC(toUTC(L.easter_sunday));
  const P = tUTC(toUTC(L.pentecost));
  const T = tUTC(d);

  if (onOrAfter(T, A) && before(T, C)) return "ad";
  if (betweenInc(T, C, BP)) return "ct";
  if (T > BP && T < SG) return "ot2";
  if (onOrAfter(T, SG) && before(T, ASH)) return "sg";
  if (onOrAfter(T, ASH) && before(T, E)) return "lt";
  if (onOrAfter(T, E) && before(T, P)) return "ea";
  if (onOrAfter(T, P) && T < A) return "ap";
  return "ap";
}

/**
 * OF season classifier.
 * @param {Date|string|number} date - Date-like value; coerced to UTC.
 * @param {import('./datum.js').Landmarks1974} L - Landmarks lookup.
 * @param {{ splitOrdinary?: boolean }} [opts]
 * @returns {'ad'|'ct'|'lt'|'ea'|'ot'|'ot1'|'ot2'}
 */
export function season1974(date, L, opts = {}) {
  const split = !!opts.splitOrdinary;
  const d = toUTC(date);
  const A = tUTC(toUTC(L.advent_sunday));
  const C = tUTC(toUTC(L.christmas));
  const BP = tUTC(toUTC(L.baptism));
  const ASH = tUTC(toUTC(L.ash_wednesday));
  const E = tUTC(toUTC(L.easter_sunday));
  const P = tUTC(toUTC(L.pentecost));
  const T = tUTC(d);

  if (onOrAfter(T, A) && before(T, C)) return "ad";
  if (betweenInc(T, C, BP)) return "ct";
  if (T > BP && T < ASH) return split ? "ot1" : "ot";
  if (onOrAfter(T, ASH) && before(T, E)) return "lt";
  if (onOrAfter(T, E) && before(T, P)) return "ea";
  if (onOrAfter(T, P) && T < A) return split ? "ot2" : "ot";
  return "ot";
}
