// src/cantus/ordinarium/index.js — Kyriale ordinary selector & parts
import KYRIALE from "../data/kyriale.js";
import MASSES from "../../festum/data/masses.js";
import GR from "../data/graduale_romanum.js";
import GR74 from "../data/graduale_romanum_1974.js";
import LU from "../data/liber_usualis.js";

const ID_INDEX = (() => {
  const m = new Map();
  for (const rows of [GR, GR74, LU]) {
    for (const r of rows) if (r && r.id) m.set(r.id, r);
  }
  return m;
})();

import { isPenitential, norm, normalizeSeason } from "../../aux/index.js";
import {
  normalizeSelectionInputs,
  buildSourceNeedle,
  filterByMode,
} from "../filters.js";
import { ORDINARY_CODES } from "../data/constants.js";

function credoDefault(festum) {
  if (festum.dow === "dominica") return true;
  return festum.rank === "t" || festum.rank === "s" || festum.rank === "f";
}
//https://media.churchmusicassociation.org/pdf/vaticannorms.pdf
const vaticanNorms = (() => {
  const isSunday = fest.dow === "dominica";
  const s = fest.season;
  const sn = normalizeSeason(s);
  const la = String(fest.title_la || fest.title || "").toLowerCase();
  const isApostle = /apostol/.test(la);
  const isFeast = fest.rank === "f" || fest.rank === "s";
  if (isSunday && s === "ad") return { credo: "IV" };
  if (isSunday && s === "lt") return { credo: "IV" };
  if (isSunday && s === "ct") return { credo: "IV" };
  if (isSunday && s === "ea") return { credo: "III" };
  if (isSunday && sn === "ot") return { credo: "I" };
  if (isApostle) return { credo: "III" };
  if (fest.bvm) return { credo: "IV" };
  if (isFeast && sn === "ot") return { credo: "III" };
  return { credo: null };
})();

const tryCodes = (codes) => {
  for (const code of codes) {
    const id = CREDO_ID[code];
    if (!id) continue;
    if (passes(id)) return { code, id };
  }
  return null;
};
// Credo selection: Vatican → Mass allowed → global fallback
const CREDO_ID = {
  I: "Liber_Usualis:344",
  II: "Liber_Usualis:2983",
  III: "Liber_Usualis:749",
  IV: "Liber_Usualis:678",
  V: "Liber_Usualis:955",
  VI: "Liber_Usualis:2934",
};
const ORDERED_CREDOS = ["I", "III", "IV", "II", "V", "VI"]; // deterministic priority

export default function ordinarium(fest, opts = {}) {
  const toRow = (m) => {
    if (m && typeof m === "object" && m.key && m.mass) return m;

    const num = Number(m);
    if (!Number.isFinite(num)) return null;
    for (const [key, v] of Object.entries(MASSES.masses || {})) {
      if (Number(v.mass) === num) {
        return {
          key,
          mass: num,
          title: v.title,
          credos: Array.isArray(v.credos) ? v.credos.map(String) : [],
        };
      }
    }
    return null;
  };

  const candidates = Array.isArray(fest?.masses) ? fest.masses : [];
  const candRows = candidates.map(toRow).filter(Boolean);
  const best = candRows[0] || null;

  const parts = {};
  if (best && KYRIALE && KYRIALE[best.key]) {
    const k = KYRIALE[best.key] || {};
    const normOpts = normalizeSelectionInputs(opts);
    const modes = new Set(normOpts.modes);
    const srcNeedle = buildSourceNeedle(normOpts.source);
    for (const code of ORDINARY_CODES) {
      const ids = Array.isArray(k[code]) ? k[code] : [];
      let filtered = filterByMode(ids, Array.from(modes));
      if (srcNeedle.length > 0) {
        const bySrc = filtered.filter((id) => {
          const row = ID_INDEX.get(String(id));
          const hay = norm(
            String(row?.source?.name || "") + " " + String(row?.id || "")
          );
          return srcNeedle.some((n) => hay.includes(n));
        });
        if (bySrc.length) filtered = bySrc;
      }
      parts[code] = filtered;
    }

    const allowed = Array.isArray(best.credos) ? best.credos.map(String) : [];
    const passes = (id) => {
      let ok = true;
      if (modes.size > 0) {
        const row = ID_INDEX.get(String(id));
        const m = row?.chant?.mode != null ? String(row.chant.mode) : "";
        ok = modes.has(m);
      }
      if (ok && srcNeedle.length > 0) {
        const row = ID_INDEX.get(String(id));
        const hay = norm(
          String(row?.source?.name || "") + " " + String(row?.id || "")
        );
        ok = srcNeedle.some((n) => hay.includes(n));
      }
      return ok;
    };

    let chosen = null;
    // 1) Vatican rubric
    if (vaticanNorms.credo) chosen = tryCodes([vaticanNorms.credo]);
    // 2) Mass-allowed list
    if (!chosen && allowed.length) chosen = tryCodes(allowed);
    // 3) Global deterministic fallback excluding already-allowed
    if (!chosen) {
      const rest = ORDERED_CREDOS.filter((c) => !allowed.includes(c));
      chosen = tryCodes(rest);
    }
    if (chosen) parts.cr = [chosen.id];
    var credoPrefLocal = chosen ? chosen.code : null;
  }

  const allowedCredos = Array.isArray(best?.credos)
    ? best.credos.map(String)
    : [];

  const credoPref =
    credoPrefLocal ||
    vaticanNorms.credo ||
    (allowedCredos.length ? allowedCredos[0] : null);

  const out = {
    selected: best
      ? { roman: best.key, mass: best.mass, title: best.title }
      : null,
    candidates: candRows
      .slice(0, 10)
      .map((m) => ({ roman: m.key, mass: m.mass, title: m.title })),
    gloria: opts.gloria ?? !isPenitential(fest.season),
    credo: opts.credo ?? credoDefault(fest),
    credo_preference: credoPref,
    parts,
  };
  if (opts.verbose) {
    const toFull = (m) => ({
      roman: m.key,
      mass: m.mass,
      title: m.title,
      credos: m.credos,
      tier: m._tier,
      rankWeight: m._rankWeight,
      seasons: m.seasons,
      ranks: m.ranks,
      days: m.days,
      bvm: m.bvm,
      aliases: m.aliases,
      notes: m.notes,
    });
    out.candidatesDetailed = candidates.map(toFull);
    if (best) out.selectedDetailed = toFull(best);
  }
  return out;
}
