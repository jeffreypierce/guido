// src/cantus/ordinarium/index.js — Kyriale ordinary selector & parts

import KYRIALE from "../data/kyriale.js";
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

import { isPenitential, norm } from "../../aux/index.js";
import { ORDINARY_CODES } from "../data/constants.js";

export function credoDefault(festum) {
  if (festum.dow === "dominica") return true;
  return festum.rank === "t" || festum.rank === "s" || festum.rank === "f";
}

export default function ordinarium(ctx, opts = {}) {
  const fest = ctx?.festum || {};
  const candidates = fest?.masses;
  const best = candidates[0] || null;

  const parts = {};
  if (best && KYRIALE && KYRIALE[best.key]) {
    const k = KYRIALE[best.key] || {};
    const modes = new Set((opts.modes || []).map(String));
    const srcNeedle = (
      Array.isArray(opts.source)
        ? opts.source
        : opts.source
        ? [opts.source]
        : []
    ).map((s) => norm(String(s)));
    for (const code of ORDINARY_CODES) {
      const ids = Array.isArray(k[code]) ? k[code] : [];
      let filtered = ids;
      if (modes.size > 0) {
        const byMode = filtered.filter((id) => {
          const row = ID_INDEX.get(String(id));
          const m = row?.chant?.mode != null ? String(row.chant.mode) : "";
          return modes.has(m);
        });
        if (byMode.length) filtered = byMode;
      }
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

    const CREDO_ID = { I: "Liber_Usualis:344", III: "Liber_Usualis:749" };
    let preferred = (best.credos || []).find((c) => CREDO_ID[c]);
    if (!preferred && fest.dow === "dominica") preferred = "I";
    if (preferred && !parts.cr?.length) {
      const id = CREDO_ID[preferred];
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
      parts.cr = ok ? [id] : [];
    }
  }

  const credoPref =
    (best &&
      Array.isArray(best.credos) &&
      best.credos.find((c) => c === "I" || c === "III")) ||
    (fest.weekday === "dominica" ? "I" : null);
  const out = {
    selected: best
      ? { roman: best.key, mass: best.mass, title: best.title }
      : null,
    candidates: candidates
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
