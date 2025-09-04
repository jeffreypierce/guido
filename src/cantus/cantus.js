// src/cantus/cantus.js — public Cantus API facade

import GR from './data/graduale_romanum.json' with { type: 'json' };
import GR74 from './data/graduale_romanum_1974.json' with { type: 'json' };
import LU from './data/liber_usualis.json' with { type: 'json' };
import LH from './data/liber_hymnarius.json' with { type: 'json' };

const ALL = [...GR, ...GR74, ...LU, ...LH];

function norm(s = '') {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Search chants by filters across Graduale Romanum (1908/1974), Liber Usualis, and Liber Hymnarius.
 * Fields supported:
 *  - offices: array of office codes (e.g., ['in','gr','al','tr','of','co','hy'])
 *  - modes: array of mode codes as strings or numbers (e.g., ['1','2'] or [1,2])
 *  - incipit: substring match (case/diacritics-insensitive)
 *  - source: substring match against source name or id prefix (e.g., 'Liber Usualis', 'Graduale_Romanum_1974')
 * @param {{ offices?: string[], modes?: (string|number)[], incipit?: string, source?: string|string[] }} [q]
 * @returns {any[]}
 */
export function cantus(q = {}) {
  const offices = (q.offices || []).map((s) => String(s).toLowerCase());
  const modes = new Set((q.modes || []).map((m) => String(m)));
  const inc = q.incipit ? norm(q.incipit) : '';
  const srcs = Array.isArray(q.source) ? q.source : q.source ? [q.source] : [];
  const srcNeedle = srcs.map((s) => norm(s));

  const out = [];
  for (const r of ALL) {
    const officeCode = String(r?.office?.code || '').toLowerCase();
    const mode = r?.chant?.mode != null ? String(r.chant.mode) : '';
    const incipit = String(r?.incipit || '');
    const id = String(r?.id || '');
    const sourceName = String(r?.source?.name || '');

    if (offices.length && !offices.includes(officeCode)) continue;
    if (modes.size && !modes.has(mode)) continue;
    if (inc && !norm(incipit).includes(inc)) continue;
    if (srcNeedle.length) {
      const hay = norm(sourceName + ' ' + id);
      if (!srcNeedle.some((n) => hay.includes(n))) continue;
    }
    out.push(r);
  }
  return out;
}

// Propers: implemented in a separate module; exported here for API stability
export { proprium } from './proprium.js';

// Ordinary: implemented in a separate module; exported as default and named
export { default as ordinarium } from './ordinarium.js';

// Ordo: minimal, data-free assembly
export { default as ordo } from './ordo.js';
