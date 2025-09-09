import { normalizeForm, normalizeSeason } from "../aux/index.js";

// src/festum/data/constants.js
export const RANKS_EF = Object.freeze({
  t: "Triduum",
  s: "Solemnity (I class)",
  f: "Feast (II class)",
  m: "Memorial (III class)",
  o: "Commemoration / Optional Memorial",
});

export const SEASONS_EF = Object.freeze({
  ad: "Advent",
  ct: "Christmastide",
  ot: "Time after Epiphany",
  sg: "Septuagesima",
  lt: "Lent",
  ea: "Eastertide",
  ap: "Time after Pentecost",
});

export const RANKS_OF = Object.freeze({
  t: "Sacred Triduum",
  s: "Solemnity",
  f: "Feast",
  m: "Memorial",
  o: "Optional Memorial",
});

export const SEASONS_OF = Object.freeze({
  ad: "Advent",
  ct: "Christmastide",
  lt: "Lent",
  ea: "Eastertide",
  ot: "Ordinary Time",
});

/**
 * Human label for a rank code in the given form.
 * @param {'t'|'s'|'f'|'m'|'o'} code
 * @param {'EF'|'OF'|'EF'|'1974'} [form='EF']
 * @returns {string}
 */
export function rankLabel(code, form = "EF") {
  const F = normalizeForm(form);
  const map = F === "OF" ? RANKS_OF : RANKS_EF;
  return map[code] || code;
}

/**
 * Human label for a season code in the given form.
 * @param {'ad'|'ct'|'lt'|'ea'|'ot'|'ot1'|'ot2'|'ap'|'sg'} code
 * @param {'EF'|'OF'|'EF'|'1974'} [form='EF']
 * @returns {string}
 */
export function seasonLabel(code, form = "EF") {
  const F = normalizeForm(form);
  const map = F === "OF" ? SEASONS_OF : SEASONS_EF;
  const c = normalizeSeason(code);
  if (F === "OF" && code === "ot") return "Ordinary Time";
  return map[c] || code;
}
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
