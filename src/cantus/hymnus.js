// src/search/hymnus.js — hymn selection (OF/EF), initial heuristic implementation

import { cantus } from "./search.js";
import { norm, tokens } from "../aux/index.js";

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

function seasonHints(season) {
  switch (season) {
    case "ad":
      return [/veni/, /adven/];
    case "lt":
      return [/parce|audi|attende|jejun|lenten|quadragesim/];
    case "ea":
      return [/resur|pasch|allelu/];
    case "ct":
      return [/nativ|epiph/];
    default:
      return [];
  }
}

function scoreHymn(festum, row) {
  let s = 0;
  const inc = norm(row.incipit || "");
  for (const rx of seasonHints(festum.season)) if (rx.test(inc)) s += 2;
  const cats = categoryTags(festum);
  const catMap = {
    apostle: [/apostol/],
    evangelist: [/evangel/],
    martyr: [/martyr/],
    virgin: [/virgin|virgo/],
    bishop: [/pontific|episcop/],
    confessor: [/confessor/],
    doctor: [/doctor/],
    bvm: [/mari/],
  };
  for (const c of cats)
    for (const rx of catMap[c] || []) if (rx.test(inc)) s += 2;
  if (row?.chant?.gabc) s += 1;
  if (row?.chant?.mode != null) s += 1;
  return s;
}

/**
 * hymnus({ festum, form, hour }, opts?)
 * - Selects a hymn (LH primary; AM optional) for the given festum and hour.
 * @param {{ festum: { title?: string, title_la?: string, id?: string, season: string }, form?: 'EF'|'OF'|'EF'|'1974', hour?: string }} ctx
 * @param {{ modes?: (string|number)[], source?: string|string[], includeAM?: boolean }} [opts]
 * @returns {{ selected: any|null, candidates: any[], hour?: string }}
 */
export function hymnus(ctx, opts = {}) {
  const festum = ctx?.festum || {};
  const hour = ctx?.hour || "vespers2";
  const sources = Array.isArray(opts.source)
    ? opts.source
    : opts.source
    ? [opts.source]
    : ["LH"];
  const offices = ["hy"];
  const modes = opts.modes || [];
  const cand = [];
  for (const src of sources)
    cand.push(...cantus({ offices, modes, source: src }));
  if (opts.includeAM && !sources.includes("AM"))
    cand.push(...cantus({ offices, modes, source: "AM" }));
  const scored = cand
    .map((r) => ({ row: r, score: scoreHymn(festum, r) }))
    .sort(
      (a, b) =>
        b.score - a.score || String(a.row.id).localeCompare(String(b.row.id))
    );
  const selected = scored.length ? scored[0].row : null;
  const candidates = scored.slice(0, 20).map((x) => x.row);
  return { selected, candidates, hour };
}

export default hymnus;
