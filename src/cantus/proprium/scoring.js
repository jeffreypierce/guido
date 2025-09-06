// src/cantus/proprium/scoring.js
import { norm, tokens } from "../../aux/index.js";

// Shared category patterns
const catMap = {
  apostle: [/apostol/],
  evangelist: [/evangel/],
  martyr: [/martyr/, /coron/, /sanguin/, /virtut/, /tribul/],
  virgin: [/virgin|virgo/],
  bishop: [/pontific|episcop|sacerdot/],
  confessor: [/confessor/],
  doctor: [/doctor/],
  abbot: [/abbat/],
  deacon: [/diacon/],
  widow: [/vidu/],
  bvm: [
    /mari/,
    /parens/,
    /genetric/,
    /deipar/,
    /sancta\s+parens/,
    /beata(e)?\s+mariae?/,
    /regina/,
    /assumpt/,
  ],
  cross: [/cruc/],
  angel: [/angel/],
};

export function countCategoryHits(incipitNorm, cats) {
  let hits = 0;
  for (const c of cats) {
    const pats = catMap[c] || [];
    for (const rx of pats) if (rx.test(incipitNorm)) hits += 1;
  }
  return hits;
}

export function categoryTags(festum) {
  const la = norm(festum.title_la || festum.title || "");
  const tags = new Set();
  const add = (b, t) => {
    if (b) tags.add(t);
  };
  add(/apostol/.test(la), "apostle");
  add(/evangelist/.test(la), "evangelist");
  add(/martyr/.test(la), "martyr");
  add(/virgin|virgo/.test(la), "virgin");
  add(/pontific|episcop/.test(la), "bishop");
  add(/confessor/.test(la), "confessor");
  add(/doctor/.test(la), "doctor");
  add(/abbat/.test(la), "abbot");
  add(/diacon/.test(la), "deacon");
  add(/vidu/.test(la), "widow");
  add(/maria|beatae\s+mariae|bmv/.test(la), "bvm");
  add(/crucis|crux/.test(la), "cross");
  add(/angel/.test(la), "angel");
  return Array.from(tags);
}

/**
 * scoreProper(festum, office, row)
 *  - Name token overlap (+2 each)
 *  - Category roots in incipit (+3 each)
 *  - Seasonal nudges: Eastertide +2 for paschal hints; Lent/Pre-Lent -4 for Alleluia, +1 for Tract
 *  - Quality: +1 gabc, +1 mode
 *  - Penalty: -3 for 'ad lib'
 */
export function scoreProper(festum, office, row) {
  if (!row) return -1e9;
  const inc = norm(row.incipit || "");
  let score = 0;

  const nameToks = tokens(festum.title_la || festum.title || festum.id || "");
  for (const t of nameToks) if (inc.includes(t)) score += 2;

  const cats = categoryTags(festum);
  score += 3 * countCategoryHits(inc, cats);

  const sea = festum.season;
  const hasAlleluiaWord = /\balleluia\b/.test(inc) || /aleluia/.test(inc);
  const paschHint = /pasch|resur|haec\s+dies/.test(inc);
  if (sea === "ea") {
    if (hasAlleluiaWord || paschHint) score += 2;
  }
  if (sea === "lt" || sea === "sg") {
    if (office === "al" || hasAlleluiaWord) score -= 4;
    if (office === "tr") score += 1;
  }

  if (row.gabc && String(row.gabc).length > 0) score += 1;
  if (row.mode != null) score += 1;
  if (/ad\s+lib/.test(inc)) score -= 3;

  return score;
}

export function selectProper(festum, office, candidates, opts = {}) {
  const prefer = new Set((opts.preferIds || []).map(Number));
  let best = null;
  let bestScore = -1e12;
  for (const row of candidates || []) {
    let s = scoreProper(festum, office, row);
    if (prefer.has(Number(row.id))) s += 5;
    if (s > bestScore) {
      best = row;
      bestScore = s;
    }
  }
  return best;
}
