// src/cantus/proprium/index.js

import { cantus as search } from "../search.js";
import DAY_INDEX from "../data/day.index.js";
import LU from "../data/liber_usualis.js";
import { norm, tokens, isPenitential } from "../../aux/index.js";
import {
  categoryTags,
  countCategoryHits,
  scoreProper,
  selectProper,
} from "./scoring.js";
import { PROPER_OFFICE_CODES } from "../data/constants.js";

const OFFICES = new Set(PROPER_OFFICE_CODES);

/** Determine if a Sequence should be included by rubric/name (EF heuristics). */
export function shouldSequence(festum) {
  const name = (
    festum.title_la ||
    festum.title ||
    festum.id ||
    ""
  ).toLowerCase();
  const easter = /easter|pasch/; // Victimae paschali
  const pentecost = /pentecost/; // Veni Sancte Spiritus
  const corpus = /\bcorpus\s*christi\b/; // Lauda Sion
  const sevenSor =
    /(seven sorrows|our lady of sorrows|dolor|septem\s+dolorum|sorrows)/; // Stabat Mater
  return (
    easter.test(name) ||
    pentecost.test(name) ||
    corpus.test(name) ||
    sevenSor.test(name)
  );
}

/** Map festum to a canonical Sequence incipit to search for. */
export function pickSequenceQuery(festum) {
  const name = (
    festum.title_la ||
    festum.title ||
    festum.id ||
    ""
  ).toLowerCase();
  if (/\bpentecost\b/.test(name)) return "Veni Sancte Spiritus";
  if (/\bcorpus\s*christi\b/.test(name)) return "Lauda Sion";
  if (/\beaster\b|pasch/.test(name)) return "Victimae paschali";
  if (
    /(seven sorrows|our lady of sorrows|dolor|septem\s+dolorum|sorrows)/.test(
      name
    )
  )
    return "Stabat Mater";
  return null;
}

export function propriumOffices1962(festum) {
  const offices = ["in"]; // Introit always
  if (festum.season === "ea") offices.push("gr", "al");
  else if (isPenitential(festum.season)) offices.push("gr", "tr");
  else offices.push("gr", "al");
  if (shouldSequence(festum)) offices.push("se");
  offices.push("of", "co");
  return offices;
}

function searchByOffice(office, opts = {}) {
  const modes = (opts.modes || []).map(String);
  const srcs = Array.isArray(opts.source)
    ? opts.source
    : opts.source
    ? [opts.source]
    : ["Graduale_Romanum", "Graduale_Romanum_1974", "Liber Usualis"]; // default corpus
  return search({ offices: [office], modes, source: srcs });
}

export function findPropersCandidates(festum, office, opts = {}) {
  const code = String(office).toLowerCase();
  if (!OFFICES.has(code)) return [];
  const rows = searchByOffice(code, opts);
  const name = norm(festum.title || festum.id || "");
  const nameTokens = tokens(name);
  const cats = categoryTags(festum);
  const scored = rows.map((r) => {
    const s = norm(r.incipit || "");
    let hit = 0;
    for (const t of nameTokens) if (s.includes(t)) hit++;
    hit += countCategoryHits(s, cats);
    return { row: r, score: hit };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored.filter((x) => x.score > 0).map((x) => x.row);
  return (best.length ? best : rows).slice(0, 30);
}

export function proprium(ctx, opts = {}) {
  const { festum } = ctx;
  const useIndex = opts.useIndex !== false; // default true
  const baseOffices = propriumOffices1962(festum);
  const items = [];

  // Build LU page -> rows index once
  if (!proprium._luByPage) {
    const toNum = (s) => {
      const m = String(s).match(/\d{1,4}/);
      return m ? Number(m[0]) : null;
    };
    const MASS_OFFICES = new Set(PROPER_OFFICE_CODES);
    const byPage = new Map();
    for (const r of LU) {
      const code = String(r?.office?.code || "").toLowerCase();
      if (!MASS_OFFICES.has(code)) continue;
      const pages = (r?.meta?.pages || [])
        .map((p) => toNum(p?.page))
        .filter(Number.isFinite);
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
        const oc = String(r?.office?.code || "").toLowerCase();
        if (office && oc !== office) continue;
        if (!ids.has(r.id)) {
          ids.add(r.id);
          rows.push(r);
        }
      }
    }
    const score = (row) => {
      const toNum = (s) => {
        const m = String(s).match(/\d{1,4}/);
        return m ? Number(m[0]) : null;
      };
      const rowPages = (row?.meta?.pages || [])
        .map((p) => toNum(p?.page))
        .filter(Number.isFinite);
      let best = 1e9;
      for (const rp of rowPages)
        for (const hp of pages || []) best = Math.min(best, Math.abs(rp - hp));
      return best;
    };
    return rows.sort((a, b) => score(a) - score(b));
  }

  function findIndexPropersByFeast(f) {
    if (!proprium._feastPropersById) {
      const map = new Map();
      const EF = DAY_INDEX?.EF || {};
      for (const key of Object.keys(EF)) {
        const v = EF[key];
        const arr = Array.isArray(v) ? v : [v];
        for (const rec of arr) {
          if (rec?.feastId && rec.propers && Object.keys(rec.propers).length) {
            if (!map.has(rec.feastId)) map.set(rec.feastId, rec.propers);
          }
        }
      }
      proprium._feastPropersById = map;
    }
    const direct = proprium._feastPropersById.get(f.feastId);
    if (direct) return direct;
    const pages = DAY_INDEX?.potPages?.[f.feastId] || [];
    if (pages && pages.length) {
      const windowPages = Array.from(
        new Set(
          pages
            .flatMap((p) => [p, p - 1, p + 1])
            .filter((n) => Number.isFinite(n) && n > 0)
        )
      );
      const byOff = {};
      for (const off of baseOffices) {
        const cands = resolvePagesToCandidates(windowPages, off).slice(0, 4);
        if (cands.length) byOff[off] = cands.map((r) => r.id);
      }
      if (Object.keys(byOff).length) return byOff;
    }
    return null;
  }

  if (!proprium._luById) {
    const map = new Map();
    for (const r of LU) map.set(String(r.id), r);
    proprium._luById = map;
  }

  const indexByOffice = useIndex ? findIndexPropersByFeast(festum) : null;
  const unionOffices = new Set(baseOffices);
  if (indexByOffice)
    for (const k of Object.keys(indexByOffice)) unionOffices.add(k);

  for (const office of unionOffices) {
    let indexCandidates = [];
    if (useIndex && indexByOffice && indexByOffice[office]) {
      const ids = indexByOffice[office].map(String);
      for (const id of ids) {
        const row = proprium._luById.get(id);
        if (row && String(row?.office?.code || "").toLowerCase() === office)
          indexCandidates.push(row);
      }
    }
    if (office === "se") {
      const q = pickSequenceQuery(festum);
      if (q) {
        const modes = (opts.modes || []).map(String);
        const srcs = Array.isArray(opts.source)
          ? opts.source
          : opts.source
          ? [opts.source]
          : ["Graduale_Romanum", "Graduale_Romanum_1974", "Liber Usualis"];
        const candidates = search({
          offices: ["se"],
          incipit: q,
          modes,
          source: srcs,
        });
        const selected = candidates[0] || null;
        items.push({ office, selected, candidates });
        continue;
      }
    }

    const fallbackCandidates = findPropersCandidates(festum, office, opts);
    const seen = new Set(indexCandidates.map((r) => String(r.id)));
    const merged = indexCandidates.slice();
    for (const r of fallbackCandidates) {
      const k = String(r.id);
      if (!seen.has(k)) {
        seen.add(k);
        merged.push(r);
      }
    }
    const selected = selectProper(festum, office, merged, opts);
    items.push({ office, selected, candidates: merged });
  }

  return items;
}

export default proprium;
