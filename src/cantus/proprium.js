// src/cantus/proprium.js

// Data via search across corpora (Graduale, LU, LH)
import { cantus as search } from "./cantus.js";
import DAY_INDEX from "./index/dayIndex.js";
import POT_INDEX from "./index/potIndex.js";
import LU from "./data/liber_usualis.js";
import COMMONS from "./index/commonsIndex.js";
import { norm, tokens, isPenitential } from "../aux/aux.js";

/**
 * Offices (short codes):
 *  - in = Introit, gr = Gradual, al = Alleluia, tr = Tract, se = Sequence,
 *    of = Offertory, co = Communion
 */
const OFFICES = new Set(["in","gr","al","tr","se","of","co"]);

// ---------- Season helpers ----------

// ---------- Sequence rubric (1962) ----------
/** Determine if a Sequence should be included by rubric/name. */
export function shouldSequence(festum) {
  const name = (festum.title || festum.id || "").toLowerCase();
  const easter = /easter/; // Victimae paschali
  const pentecost = /pentecost/; // Veni Sancte Spiritus
  const corpus = /corpus/; // Lauda Sion
  const sevenSor = /(seven sorrows|our lady of sorrows|dolor|sorrows)/; // Stabat Mater
  return (
    easter.test(name) ||
    pentecost.test(name) ||
    corpus.test(name) ||
    sevenSor.test(name)
  );
}

// ---------- Sequence selection via incipit query ----------
function pickSequenceQuery(festum) {
  const name = (festum.title || festum.id || "").toLowerCase();
  if (/\bpentecost\b/.test(name)) return "Veni Sancte Spiritus";
  if (/\bcorpus\s*christi\b/.test(name)) return "Lauda Sion";
  if (/\beaster\b/.test(name)) return "Victimae paschali";
  if (/(seven sorrows|our lady of sorrows|dolor|sorrows)/.test(name))
    return "Stabat Mater";
  return null;
}

// ---------- Offices to include (1962) ----------
/** Compute the list of offices to select for a given day (EF heuristic). */
export function propriumOffices1962(festum) {
  const offices = ["in"]; // Introit always

  if (festum.season === "ea") {
    offices.push("gr", "al");
  } else if (isPenitential(festum.season)) {
    offices.push("gr", "tr");
  } else {
    offices.push("gr", "al");
  }

  if (shouldSequence(festum)) offices.push("se");

  offices.push("of", "co");
  return offices;
}

/** Search corpus by office with optional mode/source filters. */
function searchByOffice(office, opts = {}) {
  const modes = (opts.modes || []).map(String);
  const srcs = Array.isArray(opts.source)
    ? opts.source
    : opts.source
    ? [opts.source]
    : ["Graduale_Romanum", "Graduale_Romanum_1974", "Liber Usualis"]; // default corpus
  return search({
    offices: [office],
    modes,
    source: srcs,
  });
}

// ---------- Shared category patterns & helpers ----------
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

function countCategoryHits(incipitNorm, cats) {
  let hits = 0;
  for (const c of cats) {
    const pats = catMap[c] || [];
    for (const rx of pats) if (rx.test(incipitNorm)) hits += 1;
  }
  return hits;
}

// Pull tags from the feast title to drive "commons" scoring
function categoryTags(festum) {
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

// ---------- Scoring ----------
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

  // 1) Name overlap
  const nameToks = tokens(festum.title_la || festum.title || festum.id || "");
  for (const t of nameToks) {
    if (inc.includes(t)) score += 2;
  }

  // 2) Category boosts
  const cats = categoryTags(festum);
  score += 3 * countCategoryHits(inc, cats);

  // 3) Season nudges
  const sea = festum.season;
  const hasAlleluiaWord = /\balleluia\b/.test(inc) || /aleluia/.test(inc);
  const paschHint = /pasch|resur|haec\s+dies/.test(inc);
  if (sea === "ea") {
    if (hasAlleluiaWord || paschHint) score += 2;
  }
  if (isPenitential(sea)) {
    if (office === "al" || hasAlleluiaWord) score -= 4;
    if (office === "tr") score += 1;
  }

  // 4) Quality
  if (row.gabc && String(row.gabc).length > 0) score += 1;
  if (row.mode != null) score += 1;

  // 5) Ad lib. penalty
  if (/ad\s+lib/.test(inc)) score -= 3;

  return score;
}

// Select the top row from candidates (optionally bias by id)
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

// ---------- Candidate lookup ----------
export function findPropersCandidates(festum, office, opts = {}) {
  const code = String(office).toLowerCase();
  const ok = OFFICES;
  if (!ok.has(code)) return [];

  // 2) fallback: search corpus by office + light category/name signal
  const rows = searchByOffice(code, opts);
  const name = norm(festum.title || festum.id || "");
  const nameTokens = tokens(name);
  const cats = categoryTags(festum);

  const scored = rows.map((r) => {
    const s = norm(r.incipit || "");
    let hit = 0;
    for (const t of nameTokens) if (s.includes(t)) hit++;
    // category-aware prefiltering (lightweight)
    hit += countCategoryHits(s, cats);
    return { row: r, score: hit };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored.filter((x) => x.score > 0).map((x) => x.row);
  return (best.length ? best : rows).slice(0, 30);
}

// ---------- Primary function ----------
/**
 * proprium(ctx, opts)
 * Returns: [{ office, selected, candidates }]
 * - candidates: shortlist (index first or fallbacks)
 * - selected: best-guess chosen by scoreProper
 */
export function proprium(ctx, opts = {}) {
  const { festum } = ctx;
  const useIndex = opts.useIndex !== false; // default true
  const baseOffices = propriumOffices1962(festum);
  const items = [];

  // Build a quick LU page -> rows index once (module-level cache)
  if (!proprium._luByPage) {
    const toNum = (s) => {
      const m = String(s).match(/\d{1,4}/);
      return m ? Number(m[0]) : null;
    };
    const MASS_OFFICES = new Set(["in","gr","al","tr","of","co","se"]);
    const byPage = new Map();
    for (const r of LU) {
      const code = String(r?.office?.code || '').toLowerCase();
      if (!MASS_OFFICES.has(code)) continue;
      const pages = (r?.meta?.pages || []).map((p)=>toNum(p?.page)).filter(Number.isFinite);
      for (const n of pages) {
        const arr = byPage.get(n) || [];
        arr.push(r);
        byPage.set(n, arr);
      }
    }
    proprium._luByPage = byPage;
  }

  function resolvePagesToCandidates(pages, office) {
    const byPage = proprium._luByPage;
    const ids = new Set();
    const rows = [];
    for (const p of pages || []) {
      const list = byPage.get(p) || [];
      for (const r of list) {
        const oc = String(r?.office?.code || '').toLowerCase();
        if (office && oc !== office) continue;
        if (!ids.has(r.id)) { ids.add(r.id); rows.push(r); }
      }
    }
    // sort by proximity to hint pages
    const score = (row) => {
      const toNum = (s) => { const m = String(s).match(/\d{1,4}/); return m?Number(m[0]):null; };
      const rowPages = (row?.meta?.pages || []).map((p)=>toNum(p?.page)).filter(Number.isFinite);
      let best = 1e9;
      for (const rp of rowPages) for (const hp of (pages||[])) best = Math.min(best, Math.abs(rp - hp));
      return best;
    };
    return rows.sort((a,b)=>score(a)-score(b));
  }

  function findIndexPropersByFeast(f) {
    // Try direct by feastId in dayIndex (scan small table)
    const F = DAY_INDEX?.EF || {};
    for (const k of Object.keys(F)) {
      const v = F[k];
      const arr = Array.isArray(v) ? v : [v];
      for (const rec of arr) {
        if (rec.feastId && rec.feastId === f.feastId && rec.propers && Object.keys(rec.propers).length) {
          return rec.propers;
        }
      }
    }
    // Next: use POT landmark mapping by feastId
    const pages = POT_INDEX?.pages?.[f.feastId] || [];
    if (pages && pages.length) {
      // Slight expansion: include +/-1 neighbors to be resilient
      const windowPages = Array.from(new Set(pages.flatMap((p)=>[p, p-1, p+1]).filter((n)=>Number.isFinite(n) && n>0)));
      const byOff = {};
      for (const off of baseOffices) {
        const cands = resolvePagesToCandidates(windowPages, off).slice(0, 4);
        if (cands.length) byOff[off] = cands.map((r)=>r.id);
      }
      if (Object.keys(byOff).length) return byOff;
    }
    return null;
  }

  // Precompute LU id -> row map for fast lookups
  if (!proprium._luById) {
    const map = new Map();
    for (const r of LU) map.set(String(r.id), r);
    proprium._luById = map;
  }

  const indexByOffice = useIndex ? findIndexPropersByFeast(festum) : null;
  const unionOffices = new Set(baseOffices);
  if (indexByOffice) for (const k of Object.keys(indexByOffice)) unionOffices.add(k);

  for (const office of unionOffices) {
    let indexCandidates = [];
    if (useIndex && indexByOffice && indexByOffice[office]) {
      const ids = indexByOffice[office].map(String);
      for (const id of ids) {
        const row = proprium._luById.get(id);
        if (row && String(row?.office?.code || '').toLowerCase() === office) indexCandidates.push(row);
      }
    }
    // Commons fallback (category-based pages, if/when available)
    let commonsCandidates = [];
    if ((!indexCandidates || indexCandidates.length === 0) && COMMONS && COMMONS.pages) {
      const cats = categoryTags(festum);
      const pages = new Set();
      for (const c of cats) {
        const byOff = COMMONS.pages[c]?.[office];
        if (Array.isArray(byOff)) for (const p of byOff) if (Number.isFinite(p)) pages.add(p);
      }
      if (pages.size) {
        commonsCandidates = resolvePagesToCandidates(Array.from(pages), office).slice(0, 4);
      }
    }
    // Special-case: Sequence selection by fixed ID map
    if (office === "se") {
      const q = pickSequenceQuery(festum);
      if (q) {
        const modes = (opts.modes || []).map(String);
        const srcs = Array.isArray(opts.source)
          ? opts.source
          : opts.source
          ? [opts.source]
          : ["Graduale_Romanum", "Graduale_Romanum_1974", "Liber Usualis"]; // default corpus
        const candidates = search({ offices: ["se"], incipit: q, modes, source: srcs });
        const selected = candidates[0] || null;
        items.push({ office, selected, candidates });
        continue;
      }
    }

    const fallbackCandidates = findPropersCandidates(festum, office, opts);
    // Merge with dedupe: index first, then commons, then fallback
    const seen = new Set(indexCandidates.map((r) => String(r.id)));
    const merged = indexCandidates.slice();
    for (const r of commonsCandidates) {
      const k = String(r.id);
      if (!seen.has(k)) { seen.add(k); merged.push(r); }
    }
    for (const r of fallbackCandidates) {
      const k = String(r.id);
      if (!seen.has(k)) { seen.add(k); merged.push(r); }
    }
    const selected = selectProper(festum, office, merged, opts);
    items.push({ office, selected, candidates: merged });
  }

  return items;
}

export default proprium;
