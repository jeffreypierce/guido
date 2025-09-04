// src/cantus/ordinarium.js — data-backed ordinary selector

import MASSES from "../festum/data/masses.json" with { type: "json" };
import KYRIALE from "./data/kyriale.json" with { type: "json" };
import GR from "./data/graduale_romanum.json" with { type: "json" };
import GR74 from "./data/graduale_romanum_1974.json" with { type: "json" };
import LU from "./data/liber_usualis.json" with { type: "json" };
import LH from "./data/liber_hymnarius.json" with { type: "json" };
import { seasonNormalize } from "../festum/tempus.js";
import { isPenitential, norm } from "../aux/aux.js";

const RANK_WEIGHT = { t: 5, s: 4, f: 3, m: 2, o: 1 };

function buildMassRows() {
  return Object.entries(MASSES.masses || {}).map(([key, v]) => ({
    key,
    mass: Number(v.mass),
    title: v.title,
    seasons: v.seasons || [],
    ranks: v.ranks || [],
    days: v.days || [],
    bvm: !!v.bvm,
  }));
}

function isMarianFeastLike(fest) {
  const id = String(fest?.feastId || fest?.id || "");
  const title = String(fest?.title || "");
  const hay = (id + " " + title).toLowerCase();
  return /\bbvm\b|\bmary\b|maria|immaculate|annunciation|assumption|rosary|mother[_\s]?of[_\s]?god|heart[_\s]?of[_\s]?mary/.test(hay);
}

function selectCandidates(festum, opts = {}) {
  const rows = buildMassRows();
  const exact = festum.season;
  const generic = seasonNormalize(exact);
  const weekday = festum.weekday;
  // Base BVM from festum; optionally broaden with heuristic (Marian keywords)
  let bvmFlag = !!festum.bvm;
  if (!bvmFlag && opts.bvmHeuristic) {
    bvmFlag = isMarianFeastLike(festum);
  }

  const tiers = [];
  // strict
  tiers.push(rows.filter(
    (m) => (m.seasons.includes(exact) || m.seasons.includes(generic)) &&
            m.ranks.includes(festum.rank) &&
            m.days.includes(weekday) &&
            (!bvmFlag || m.bvm)
  ));
  if (bvmFlag && tiers[0].length === 0) {
    tiers.push(rows.filter(
      (m) => (m.seasons.includes(exact) || m.seasons.includes(generic)) &&
              m.ranks.includes(festum.rank) &&
              m.days.includes(weekday)
    ));
  }
  if (opts.lenientSelection) {
    tiers.push(rows.filter(
      (m) => (m.seasons.includes(exact) || m.seasons.includes(generic)) &&
              m.days.includes(weekday)
    ));
    tiers.push(rows.filter(
      (m) => (m.seasons.includes(exact) || m.seasons.includes(generic))
    ));
    tiers.push(rows.slice());
  }

  const seen = new Set();
  const out = [];
  tiers.forEach((arr, i) => {
    for (const m of arr) {
      if (seen.has(m.key)) continue;
      seen.add(m.key);
      const rw = Math.max(0, ...m.ranks.map((r) => RANK_WEIGHT[r] || 0));
      out.push({ ...m, _tier: i, _rankWeight: rw });
    }
  });
  out.sort((a, b) =>
    a._tier - b._tier ||
    b._rankWeight - a._rankWeight ||
    a.mass - b.mass ||
    a.key.localeCompare(b.key)
  );
  return out;
}

/** Default Gloria/Credo heuristics */
export function gloriaDefault(festum) {
  if (isPenitential(festum.season)) return false;
  return true;
}
export function credoDefault(festum) {
  if (festum.weekday === 'dominica') return true;
  return festum.rank === 't' || festum.rank === 's' || festum.rank === 'f';
}

export default function ordinarium(ctx, opts = {}) {
  const fest = ctx?.festum || {};
  const candidates = selectCandidates(fest, opts);
  const best = candidates[0] || null;

  const parts = {};
  if (best && KYRIALE && KYRIALE[best.key]) {
    const k = KYRIALE[best.key] || {};
    // Build id->row index for mode lookups when filtering
    const IDX = new Map();
    for (const rows of [GR, GR74, LU, LH]) {
      for (const r of rows) if (r && r.id) IDX.set(r.id, r);
    }
    const modes = new Set((opts.modes || []).map(String));
    const srcNeedle = (Array.isArray(opts.source) ? opts.source : (opts.source ? [opts.source] : []))
      .map((s) => norm(String(s)));
    for (const code of ['ky','gl','cr','sa','ag','it','be']) {
      const ids = Array.isArray(k[code]) ? k[code] : [];
      let filtered = ids;
      if (modes.size > 0) {
        const byMode = filtered.filter((id) => {
          const row = IDX.get(String(id));
          const m = row?.chant?.mode != null ? String(row.chant.mode) : '';
          return modes.has(m);
        });
        if (byMode.length) filtered = byMode;
      }
      if (srcNeedle.length > 0) {
        const bySrc = filtered.filter((id) => {
          const row = IDX.get(String(id));
          const hay = norm(String(row?.source?.name || '') + ' ' + String(row?.id || ''));
          return srcNeedle.some((n) => hay.includes(n));
        });
        if (bySrc.length) filtered = bySrc;
      }
      parts[code] = filtered;
    }
  }

  return {
    selected: best ? { roman: best.key, mass: best.mass, title: best.title } : null,
    candidates: candidates.slice(0, 10).map((m) => ({ roman: m.key, mass: m.mass, title: m.title })),
    gloria: opts.gloria ?? gloriaDefault(fest),
    credo: opts.credo ?? credoDefault(fest),
    parts,
  };
}
