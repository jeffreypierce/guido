// src/festum/tempus.js

import { toUTC } from "../aux/aux";
const tUTC = (d) =>
  Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

/** Inclusive day-range check: a ≤ x ≤ b */
const betweenInc = (x, a, b) => x >= a && x <= b;
/** Strict before/after (day precision) */
const before = (x, a) => x < a;
const onOrAfter = (x, a) => x >= a;

export function normalizeSeason(seasonCode) {
  // Prefer exact codes first; fallback to generic buckets.
  switch (seasonCode) {
    case "ot2":
      return "ot"; // EF → generic
    case "ap":
      return "ot"; // EF → generic
    case "sg":
      return "lt"; // map pre-Lent to Lent (or "ot" if you prefer)
    case "ot1":
      return "ot"; // optional OF split
    default:
      return seasonCode; // ad/ct/lt/ea/ot already fine
  }
}

/**
 * 1962 (EF) season classifier.
 * Expects Landmarks with fields: christmas, epiphany, baptism, advent_sunday,
 * septuagesima, ash_wednesday, easter_sunday, pentecost.
 * Returns one of: 'ad','ct','ot2','sg','lt','ea','ap'
 * @param {Date|string|number} date
 * @param {Landmarks<string, Date>} L
 */
export function season1962(date, L) {
  const d = toUTC(date);

  const A = tUTC(toUTC(L.advent_sunday));
  const C = tUTC(toUTC(L.christmas));
  const EP = tUTC(toUTC(L.epiphany));
  const BP = tUTC(toUTC(L.baptism));
  const SG = tUTC(toUTC(L.septuagesima));
  const ASH = tUTC(toUTC(L.ash_wednesday));
  const E = tUTC(toUTC(L.easter_sunday));
  const P = tUTC(toUTC(L.pentecost));

  const T = tUTC(d);

  // Advent: Advent Sunday → day before Christmas
  if (onOrAfter(T, A) && before(T, C)) return "ad";

  // Christmastide: Christmas → Baptism (inclusive)
  if (betweenInc(T, C, BP)) return "ct";

  // Time after Epiphany (EF 'ot2'): day after Baptism → day before Septuagesima
  if (T > BP && T < SG) return "ot2";

  // Septuagesima: Septuagesima Sunday → day before Ash Wednesday
  if (onOrAfter(T, SG) && before(T, ASH)) return "sg";

  // Lent: Ash Wednesday → day before Easter Sunday
  if (onOrAfter(T, ASH) && before(T, E)) return "lt";

  // Eastertide: Easter Sunday → day before Pentecost
  if (onOrAfter(T, E) && before(T, P)) return "ea";

  // Time after Pentecost (EF 'ap'): Pentecost → day before Advent Sunday
  if (onOrAfter(T, P) && T < A) return "ap";

  // Fallback (should not happen)
  return "ap";
}

/**
 * 1974 (OF) season classifier.
 * Expects L with fields: christmas, epiphany, baptism, advent_sunday,
 * ash_wednesday, easter_sunday, pentecost.
 * Returns one of: 'ad','ct','lt','ea','ot' (or 'ot1'/'ot2' if splitOrdinary)
 * @param {Date|string|number} date
 * @param {Record<string, Date>} L
 * @param {{ splitOrdinary?: boolean }} [opts]
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

  // Advent: Advent Sunday → day before Christmas
  if (onOrAfter(T, A) && before(T, C)) return "ad";

  // Christmastide: Christmas → Baptism (inclusive)
  if (betweenInc(T, C, BP)) return "ct";

  // Ordinary Time I: day after Baptism → day before Ash Wednesday
  if (T > BP && T < ASH) return split ? "ot1" : "ot";

  // Lent: Ash Wednesday → day before Easter Sunday
  if (onOrAfter(T, ASH) && before(T, E)) return "lt";

  // Eastertide: Easter Sunday → Pentecost (inclusive of vigil? here we stop day before next block)
  if (onOrAfter(T, E) && before(T, P)) return "ea";

  // Ordinary Time II: Monday after Pentecost → day before Advent Sunday
  if (onOrAfter(T, P) && T < A) return split ? "ot2" : "ot";

  // Fallback
  return "ot";
}
