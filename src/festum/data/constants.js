// src/festum/data/constants.js
export const RANKS_1962 = Object.freeze({
  t: "Triduum",
  s: "Solemnity (I class)",
  f: "Feast (II class)",
  m: "Memorial (III class)",
  o: "Commemoration / Optional Memorial",
});

export const SEASONS_1962 = Object.freeze({
  ad: "Advent",
  ct: "Christmastide",
  ot2: "Time after Epiphany",
  sg: "Septuagesima",
  lt: "Lent",
  ea: "Eastertide",
  ap: "Time after Pentecost",
});

export const RANKS_1974 = Object.freeze({
  t: "Sacred Triduum",
  s: "Solemnity",
  f: "Feast",
  m: "Memorial",
  o: "Optional Memorial",
});

export const SEASONS_1974 = Object.freeze({
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
  const F = String(form || "").toUpperCase();
  const map = F === "OF" || F === "1974" ? RANKS_1974 : RANKS_1962;
  return map[code] || code;
}

/**
 * Human label for a season code in the given form.
 * @param {'ad'|'ct'|'lt'|'ea'|'ot'|'ot1'|'ot2'|'ap'|'sg'} code
 * @param {'EF'|'OF'|'EF'|'1974'} [form='EF']
 * @returns {string}
 */
export function seasonLabel(code, form = "EF") {
  const F = String(form || "").toUpperCase();
  const map = F === "OF" || F === "1974" ? SEASONS_1974 : SEASONS_1962;
  if ((F === "OF" || F === "1974") && (code === "ot1" || code === "ot2"))
    return "Ordinary Time";
  return map[code] || code;
}
