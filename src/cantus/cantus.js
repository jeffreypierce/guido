// src/cantus/cantus.js — public Cantus API facade

import GR from './data/graduale_romanum.js';
import GR74 from './data/graduale_romanum_1974.js';
import LU from './data/liber_usualis.js';
import LH from './data/liber_hymnarius.js';
import AM from './data/antiphonale_monasticum.js';
import ALIASES from './data/aliases.js';

const ALL = [...GR, ...GR74, ...LU, ...LH, ...AM];
// Build a fast id->row index for canonicalization
const ID_INDEX = (() => {
  const m = new Map();
  for (const r of ALL) if (r && r.id) m.set(String(r.id), r);
  return m;
})();
// Hoisted lightweight indexes for common filters
const BY_OFFICE = (() => {
  const m = new Map();
  for (const r of ALL) {
    const code = String(r?.office?.code || '').toLowerCase();
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
    const mode = r?.chant?.mode != null ? String(r.chant.mode) : '';
    if (!mode) continue;
    const arr = m.get(mode);
    if (arr) arr.push(r);
    else m.set(mode, [r]);
  }
  return m;
})();

function norm(s = '') {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Search chants across Graduale Romanum (1908/1974), Liber Usualis, and Liber Hymnarius.
 *
 * Fields supported:
 *  - offices: array of office codes (e.g., ['in','gr','al','tr','of','co','hy']).
 *  - modes: array of mode codes (string or number) to filter by, e.g., ['1','2'].
 *  - incipit: substring match on incipit (case/diacritics-insensitive).
 *  - source: substring match against source name or id (string or string[]),
 *            e.g., 'Liber Usualis', 'Graduale_Romanum_1974'.
 *
 * @param {{ offices?: string[], modes?: (string|number)[], incipit?: string, source?: string|string[] }} [q]
 * @returns {any[]} Array of raw chant rows from the corpora (unchanged shape)
 */
export function cantus(q = {}) {
  const offices = (q.offices || []).map((s) => String(s).toLowerCase());
  const modes = new Set((q.modes || []).map((m) => String(m)));
  const inc = q.incipit ? norm(q.incipit) : '';
  const srcs = Array.isArray(q.source) ? q.source : q.source ? [q.source] : [];
  const SOURCE_ALIASES = new Map([
    ['GR', 'Graduale Romanum'],
    ['GR1974', 'Graduale Romanum 1974'],
    ['LU', 'Liber Usualis'],
    ['LH', 'Liber Hymnarius'],
    ['AM', 'Antiphonale Monasticum'],
  ]);
  const srcNeedle = srcs.flatMap((s) => {
    const key = String(s).toUpperCase();
    const alias = SOURCE_ALIASES.get(key);
    return alias ? [norm(alias), norm(String(s))] : [norm(String(s))];
  });

  // Choose a base set using indexes to reduce scans
  let base;
  if (offices.length) {
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
  // reverse alias: canonical -> [aliasIds]
  const REV_ALIAS = (() => {
    const m = new Map();
    for (const [a, c] of Object.entries(ALIASES)) {
      const arr = m.get(c) || [];
      arr.push(a);
      m.set(c, arr);
    }
    return m;
  })();
  const friendlySource = (id) => String(id).split(':')[0].replace(/_/g, ' ');
  for (const r of base) {
    const officeCode = String(r?.office?.code || '').toLowerCase();
    const mode = r?.chant?.mode != null ? String(r.chant.mode) : '';
    const incipit = String(r?.incipit || '');
    const id = String(r?.id || '');
    const sourceName = String(r?.source?.name || '');

    if (offices.length && !offices.includes(officeCode)) continue;
    if (modes.size && !modes.has(mode)) continue;
    if (inc && !norm(incipit).includes(inc)) continue;
    const canId = ALIASES[id] || id;
    if (seenCanonical.has(canId)) continue;
    const canonRow = ID_INDEX.get(canId) || r;
    if (srcNeedle.length) {
      const hay = norm(sourceName + ' ' + id);
      if (srcNeedle.some((n) => hay.includes(n))) {
        out.push(canonRow);
        seenCanonical.add(canId);
        continue;
      }
      // try projecting via alias ids for this canonical id to satisfy source filter
      const aliasList = REV_ALIAS.get(canId) || [];
      const matchAlias = aliasList.find((aid) => srcNeedle.some((n) => norm(friendlySource(aid) + ' ' + aid).includes(n)));
      if (matchAlias) {
        const projected = { ...canonRow, id: matchAlias, source: { ...(canonRow.source||{}), name: friendlySource(matchAlias) } };
        out.push(projected);
        seenCanonical.add(canId);
        continue;
      }
      // no source match — skip
      continue;
    }
    out.push(canonRow);
    seenCanonical.add(canId);
  }
  return out;
}

// Propers: implemented in a separate module; exported here for API stability
export { proprium } from './proprium.js';

// Ordinary: implemented in a separate module; exported as default and named
export { default as ordinarium } from './ordinarium.js';

// Ordo: minimal, data-free assembly
export { default as ordo } from './ordo.js';

// Hymns: heuristic selection (LH/AM)
export { default as hymnus, hymnus as hymn } from './hymnus.js';
