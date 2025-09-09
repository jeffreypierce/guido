// src/cantus/search.js — public Cantus search API

import GR from "./data/graduale_romanum.js";
import GR74 from "./data/graduale_romanum_1974.js";
import LU from "./data/liber_usualis.js";
import LH from "./data/liber_hymnarius.js";
import AM from "./data/antiphonale_monasticum.js";
import ALIASES from "./data/aliases.js";
import { SOURCE_ALIASES } from "./filters.js";
//  import DAY_INDEX from "./data/day.index.js";
import { norm } from "../aux/index.js";

const ALL = [...GR, ...GR74, ...LU, ...LH, ...AM];

// lightweight indexes for common filters
const ID_INDEX = (() => {
  const m = new Map();
  for (const r of ALL) if (r && r.id) m.set(String(r.id), r);
  return m;
})();

const BY_OFFICE = (() => {
  const m = new Map();
  for (const r of ALL) {
    const code = String(r?.office?.code || "").toLowerCase();
    if (!code) continue;
    const arr = m.get(code);
    if (arr) arr.push(r);
    else m.set(code, [r]);
  }
  return m;
})();
const BY_MODE = (() => {
  const m = new Map();
  for (const r of ALL) {
    const mode = r?.chant?.mode != null ? String(r.chant.mode) : "";
    if (!mode) continue;
    const arr = m.get(mode);
    if (arr) arr.push(r);
    else m.set(mode, [r]);
  }
  return m;
})();

const REV_ALIAS = (() => {
  const m = new Map();
  for (const [a, c] of Object.entries(ALIASES)) {
    const arr = m.get(c) || [];
    arr.push(a);
    m.set(c, arr);
  }
  return m;
})();

// Source aliases centralized in filters.js

/**
 * Search chants across Graduale Romanum (1908/1974), Liber Usualis, and Liber Hymnarius.
 * See original JSDoc in former cantus.js for field details.
 */
export function cantus(q = {}) {
  const offices = (q.offices || []).map((s) => String(s).toLowerCase());
  const modes = new Set((q.modes || []).map((m) => String(m)));
  const inc = q.incipit ? norm(q.incipit) : "";
  const srcs = Array.isArray(q.source) ? q.source : q.source ? [q.source] : [];

  const srcNeedle = srcs.flatMap((s) => {
    const key = String(s).toUpperCase();
    const alias = SOURCE_ALIASES.get(key);
    return alias ? [norm(alias), norm(String(s))] : [norm(String(s))];
  });

  // Choose a base set using indexes to reduce scans
  let base;
  if (offices.length && modes.size) {
    const byOffice = [];
    for (const code of offices) {
      const bucket = BY_OFFICE.get(code);
      if (bucket) byOffice.push(...bucket);
    }
    const byMode = [];
    for (const m of modes) {
      const bucket = BY_MODE.get(m);
      if (bucket) byMode.push(...bucket);
    }
    base =
      byOffice.length && byOffice.length <= byMode.length
        ? byOffice
        : byMode.length
        ? byMode
        : ALL;
  } else if (offices.length) {
    const acc = [];
    for (const code of offices) {
      const bucket = BY_OFFICE.get(code);
      if (bucket) acc.push(...bucket);
    }
    base = acc;
  } else if (modes.size) {
    const acc = [];
    for (const m of modes) {
      const bucket = BY_MODE.get(m);
      if (bucket) acc.push(...bucket);
    }
    base = acc.length ? acc : ALL;
  } else {
    base = ALL;
  }

  const out = [];
  const seenCanonical = new Set();
  const friendlySource = (id) => String(id).split(":")[0].replace(/_/g, " ");

  for (const r of base) {
    const officeCode = String(r?.office?.code || "").toLowerCase();
    const mode = r?.chant?.mode != null ? String(r.chant.mode) : "";
    const incipit = String(r?.incipit || "");
    const id = String(r?.id || "");
    const sourceName = String(r?.source?.name || "");

    if (offices.length && !offices.includes(officeCode)) continue;
    if (modes.size && !modes.has(mode)) continue;
    if (inc && !norm(incipit).includes(inc)) continue;
    const canId = ALIASES[id] || id;
    if (seenCanonical.has(canId)) continue;
    const canonRow = ID_INDEX.get(canId) || r;
    if (srcNeedle.length) {
      const hay = norm(sourceName + " " + id);
      if (srcNeedle.some((n) => hay.includes(n))) {
        out.push(canonRow);
        seenCanonical.add(canId);
        continue;
      }
      const aliasList = REV_ALIAS.get(canId) || [];
      const matchAlias = aliasList.find((aid) =>
        srcNeedle.some((n) => norm(friendlySource(aid) + " " + aid).includes(n))
      );
      if (matchAlias) {
        const projected = {
          ...canonRow,
          id: matchAlias,
          source: {
            ...(canonRow.source || {}),
            name: friendlySource(matchAlias),
          },
        };
        out.push(projected);
        seenCanonical.add(canId);
        continue;
      }
      continue;
    }
    out.push(canonRow);
    seenCanonical.add(canId);
  }
  return out;
}
/** Lookup pre-indexed selections by date. */
// export function byDay(day, { form = "EF" } = {}) {
//   const F = String(form).toUpperCase() === "OF" ? "OF" : "EF";
//   let ymd;
//   if (typeof day === "string") {
//     ymd = day;
//   } else if (day && typeof day === "object" && typeof day.ymd === "string") {
//     ymd = day.ymd;
//   } else if (day instanceof Date) {
//     const d = new Date(
//       Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate())
//     );
//     const mm = (d.getUTCMonth() + 1).toString().padStart(2, "0");
//     const dd = d.getUTCDate().toString().padStart(2, "0");
//     ymd = `${d.getUTCFullYear()}-${mm}-${dd}`;
//   } else {
//     return null;
//   }
//   const mmdd = ymd.slice(5);
//   const table = DAY_INDEX?.[F] || {};
//   return table[ymd] || table[mmdd] || null;
// }
