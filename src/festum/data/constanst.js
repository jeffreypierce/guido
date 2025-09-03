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
  ot: "Ordinary Time",
  lt: "Lent",
  ea: "Eastertide",
});

export function rankLabel(code, form = "1962") {
  const map = form === "1974" ? RANKS_1974 : RANKS_1962;
  return map[code] || code;
}

export function seasonLabel(code, form = "1962") {
  const map = form === "1974" ? SEASONS_1974 : SEASONS_1962;
  if (form === "1974" && (code === "ot1" || code === "ot2")) code = "ot";
  return map[code] || code;
}
