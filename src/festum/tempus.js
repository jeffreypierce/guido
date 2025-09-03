// src/festum/tempus.js
import { toUTC } from "../aux/aux";
const tUTC = (d) =>
  Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
const betweenInc = (x, a, b) => x >= a && x <= b;
const before = (x, a) => x < a;
const onOrAfter = (x, a) => x >= a;

export function seasonNormalize(seasonCode) {
  // Map legacy or form-specific codes into generic buckets for mass selection.
  switch (seasonCode) {
    case "pt":
      return "ea"; // legacy Paschaltide → Eastertide
    case "ot2":
      return "ot"; // EF → generic
    case "ap":
      return "ot"; // EF → generic
    case "sg":
      return "lt"; // treat pre-Lent like Lent (or "ot" if you prefer)
    case "ot1":
      return "ot"; // OF split → generic
    default:
      return seasonCode; // ad/ct/lt/ea/ot already fine
  }
}

/** 1962 (EF) season: 'ad','ct','ot2','sg','lt','ea','ap' */
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

/** 1974 (OF) season: 'ad','ct','lt','ea','ot' (optionally 'ot1'/'ot2') */
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
