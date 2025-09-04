#!/usr/bin/env node
// tool/build-indices.mjs — build lightweight indices from /etc sources
// Generates:
// - src/cantus/index/dayIndex.json — EF/OF → (YMD or MM-DD) → entry
// - src/cantus/index/chantIndex.json — placeholder for reverse lookups (future)

import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

// pretty logging
const TTY = process.stdout.isTTY || process.env.FORCE_COLOR === '1';
const C = (code) => (s) => (TTY ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const bold = C(1), green = C(32), cyan = C(36), yellow = C(33), gray = C(90);
const check = green('✓');
const warn = yellow('!');
const bullet = cyan('•');
function header(title){ const line = gray('─'.repeat(Math.max(3, 60 - title.length))); console.log(`${bold(title)} ${line}`); }

const repoRoot = path.resolve(process.cwd());
const etcDir = path.join(repoRoot, 'etc');
const outDir = path.join(repoRoot, 'src', 'cantus', 'index');

const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
const MONTHS = new Map([
  ['january', 0], ['february', 1], ['march', 2], ['april', 3], ['may', 4], ['june', 5],
  ['july', 6], ['august', 7], ['september', 8], ['october', 9], ['november', 10], ['december', 11],
]);

async function readJSON(p) {
  const txt = await fs.readFile(p, 'utf8');
  return JSON.parse(txt);
}

function normalizeTitle(str) {
  if (!str) return '';
  let s = String(str).replace(/[\u200B-\u200D\uFEFF]/g, ''); // zero-width
  s = s.replace(/\s+/g, ' ').trim();
  const parts = s.split(' ');
  const out = [];
  for (let i = 0; i < parts.length; ) {
    let j = i;
    while (j < parts.length && /^[A-Za-z]$/.test(parts[j])) j++;
    if (j - i >= 3) {
      out.push(parts.slice(i, j).join('')); // collapse spaced letters
      i = j;
    } else {
      out.push(parts[i]);
      i++;
    }
  }
  return out.join(' ');
}

function parsePageHints(str) {
  // Extract page numbers and ranges like "pp.1528–1538" or "p. 455"
  if (!str || typeof str !== 'string') return [];
  const s = str.replace(/\s+/g, ' ');
  const pages = [];
  // Match ranges with hyphen or en dash
  const rangeRe = /(\d{1,4})\s*[–-]\s*(\d{1,4})/g;
  let m;
  while ((m = rangeRe.exec(s))) {
    const a = Number(m[1]), b = Number(m[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) pages.push({ from: Math.min(a, b), to: Math.max(a, b) });
  }
  // Match single pages (avoid duplicates already in ranges)
  const singleRe = /(\d{1,4})/g;
  while ((m = singleRe.exec(s))) {
    const n = Number(m[1]);
    if (!Number.isFinite(n)) continue;
    const covered = pages.some(r => typeof r === 'object' && r && 'from' in r ? n >= r.from && n <= r.to : n === r);
    if (!covered) pages.push(n);
  }
  return pages;
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const dayIndexJsonPath = path.join(outDir, 'dayIndex.json');
  const dayIndexJsPath = path.join(outDir, 'dayIndex.js');
  const potIndexJsPath = path.join(outDir, 'potIndex.js');
  const EMIT_JSON = process.argv.includes('--emit-json') || process.env.EMIT_JSON === '1';

  header('Build: Indices');
  // Source files (optional, builder is resilient)
  const luCalPath = path.join(etcDir, 'LU_calendar.json');
  const luSaintsPath = path.join(etcDir, 'LU_proper_of_saints.json');
  const lhFeastPagesPath = path.join(etcDir, 'LH_feast_pages.json');
  const lhEnglishAdaptPath = path.join(etcDir, 'LH_english_adaptation.json');

  const index = { _meta: { generatedAt: new Date().toISOString(), sources: [] }, EF: {}, OF: {} };

  // Build EF calendar MM-DD map from LU_calendar.json (year-agnostic)
  try {
    const luCal = await readJSON(luCalPath);
    index._meta.sources.push({ id: 'LU_calendar', path: path.relative(repoRoot, luCalPath), schema: luCal?.schema || null });
    const entries = Array.isArray(luCal?.entries) ? luCal.entries : [];
    let added = 0;
    for (const e of entries) {
      const mName = String(e?.month || '').trim();
      const m = MONTHS.get(mName.toLowerCase());
      const day = Number(e?.day);
      if (m == null || !Number.isInteger(day) || day <= 0 || day > 31) continue;
      const mmdd = `${pad2(m + 1)}-${pad2(day)}`;
      const rec = {
        title: normalizeTitle(e?.title || ''),
        class_rank: e?.class_rank || null,
        raw_class: e?.raw_class || null,
        type_hint: e?.type_hint || null,
        pages: (Array.isArray(e?.pages) ? e.pages : []).map(String),
        _from: 'lu_calendar',
      };
      // Multiple entries on same MM-DD: keep an array; otherwise single object
      const prev = index.EF[mmdd];
      if (!prev) index.EF[mmdd] = rec;
      else if (Array.isArray(prev)) prev.push(rec);
      else index.EF[mmdd] = [prev, rec];
      added++;
    }
    console.log(`${check} LU_calendar → EF MM-DD: ${added}`);
  } catch (e) {
    console.warn(`${warn} skip LU_calendar: ${e?.message || e}`);
  }

  // Skip inlining LH_feast_pages and English adaptation incipits into index; use them only for build-time matching
  try {
    await fs.access(lhFeastPagesPath);
    index._meta.sources.push({ id: 'LH_feast_pages', path: path.relative(repoRoot, lhFeastPagesPath) });
  } catch {}
  try {
    await fs.access(lhEnglishAdaptPath);
    // Not used for EF hymn ID mapping; tracked for provenance only
    index._meta.sources.push({ id: 'LH_english_adaptation', path: path.relative(repoRoot, lhEnglishAdaptPath) });
  } catch {}

  // Merge LU Proper of Saints (months -> day entries)
  try {
    const luS = await readJSON(luSaintsPath);
    index._meta.sources.push({ id: 'LU_proper_of_saints', path: path.relative(repoRoot, luSaintsPath) });
    const months = luS?.months || {};
    let added = 0;
    for (const [mName, days] of Object.entries(months)) {
      const m = MONTHS.get(String(mName).toLowerCase());
      if (m == null || !days || typeof days !== 'object') continue;
      for (const k of Object.keys(days)) {
        const row = days[k];
        if (!row) continue;
        // Derive day number: try explicit `date` first (e.g., "Jul 1"), else parse key as 1-based index
        let dayNum = null;
        if (typeof row.date === 'string') {
          const m2 = row.date.match(/\b(\d{1,2})\b/);
          if (m2) dayNum = Number(m2[1]);
        }
        if (!Number.isInteger(dayNum)) {
          const asNum = Number(k);
          if (Number.isInteger(asNum)) dayNum = asNum + 1; // keys appear 0-based
        }
        if (!Number.isInteger(dayNum) || dayNum <= 0 || dayNum > 31) continue;
        const mmdd = `${pad2(m + 1)}-${pad2(dayNum)}`;
        const rec = {
          feast: normalizeTitle(row.feast || null),
          title: normalizeTitle(row.feast || ''),
          class: row.class || null,
          office: row.office || null,
          mass: row.mass || null,
          propers_pages: parsePageHints(row.mass || ''),
          notes: row.notes || null,
          _from: 'lu_saints',
        };
        const prev = index.EF[mmdd];
        if (!prev) index.EF[mmdd] = rec;
        else if (Array.isArray(prev)) prev.push(rec);
        else index.EF[mmdd] = [prev, rec];
        added++;
      }
    }
    console.log(`${check} LU_proper_of_saints → EF MM-DD merged: ${added}`);
  } catch (e) {
    console.warn(`${warn} skip LU_proper_of_saints: ${e?.message || e}`);
  }

  // Merge LU Proper of Time — precompile explicit day pages; leave seasonal fallbacks to runtime
  try {
    const potPath = path.join(etcDir, 'LU_proper_of_time.json');
    const pot = await readJSON(potPath);
    index._meta.sources.push({ id: 'LU_proper_of_time', path: path.relative(repoRoot, potPath) });

    const MONTHS_MAP = new Map([
      ['january', 1], ['february', 2], ['march', 3], ['april', 4], ['may', 5], ['june', 6],
      ['july', 7], ['august', 8], ['september', 9], ['october', 10], ['november', 11], ['december', 12],
    ]);
    const toMMDD = (s) => {
      if (typeof s !== 'string') return null;
      const m = s.match(/([A-Za-z]+)\s+(\d{1,2})/);
      if (!m) return null;
      const mon = MONTHS_MAP.get(m[1].toLowerCase());
      const day = Number(m[2]);
      if (!mon || !Number.isInteger(day)) return null;
      return `${pad2(mon)}-${pad2(day)}`;
    };
    const addPropersPages = (mmdd, pages) => {
      if (!mmdd || !pages || pages.length === 0) return;
      const prev = index.EF[mmdd];
      const append = (rec) => {
        const arr = Array.isArray(rec.propers_pages) ? rec.propers_pages : [];
        for (const p of pages) arr.push(p);
        rec.propers_pages = arr;
      };
      if (!prev) {
        const rec = { title: '', pages: [], propers: {}, hymns: {}, ordinary: {}, _from: 'pot_date' };
        append(rec);
        index.EF[mmdd] = rec;
      } else if (Array.isArray(prev)) {
        prev.forEach(append);
      } else {
        append(prev);
      }
    };
    const collectPagesInObj = (obj) => {
      const pages = [];
      const recur = (v) => {
        if (v == null) return;
        if (typeof v === 'string') {
          const ps = parsePageHints(v);
          if (ps && ps.length) pages.push(...ps);
          return;
        }
        if (Array.isArray(v)) { v.forEach(recur); return; }
        if (typeof v === 'object') { for (const k in v) recur(v[k]); }
      };
      recur(obj);
      return pages;
    };
    let addedPOT = 0;
    const POT_MAP = {}; // key -> pages from named landmarks for runtime use
    const sections = pot?.proper_time?.proper_of_time?.sections || {};
    // Traverse sections looking for explicit day nodes with a 'date' field or month-day ranges in keys like jan_7_to_12
    for (const [secName, secObj] of Object.entries(sections)) {
      if (secObj && typeof secObj === 'object') {
        for (const [key, node] of Object.entries(secObj)) {
          const mmdd = toMMDD(node?.date || node?.when || '');
          if (mmdd) {
            const pages = collectPagesInObj(node);
            if (pages.length) { addPropersPages(mmdd, pages); addedPOT++; }
            continue;
          }
          // Handle ranges like jan_2_to_5, mar_10_to_12 for any month
          {
            const m = key.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)_(\d+)_to_(\d+)$/i);
            if (m) {
              const mon = MONTHS_MAP.get(m[1].toLowerCase());
              const a = Number(m[2]), b = Number(m[3]);
              if (mon && Number.isInteger(a) && Number.isInteger(b) && a <= b) {
                const pages = collectPagesInObj(node);
                for (let d = a; d <= b; d++) {
                  if (pages.length) { addPropersPages(`${pad2(mon)}-${pad2(d)}`, pages); addedPOT++; }
                }
              }
              continue;
            }
          }
          // Handle single day like feb_2, mar_25 etc
          {
            const m = key.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)_(\d+)$/i);
            if (m) {
              const mon = MONTHS_MAP.get(m[1].toLowerCase());
              const d = Number(m[2]);
              if (mon && Number.isInteger(d)) {
                const pages = collectPagesInObj(node);
                if (pages.length) { addPropersPages(`${pad2(mon)}-${pad2(d)}`, pages); addedPOT++; }
              }
              continue;
            }
          }
          // Capture landmark-named nodes for runtime matching via festum.feastId
          const pages2 = collectPagesInObj(node);
          if (pages2.length) {
            const keyNorm = String(key).toLowerCase();
            // Known EF landmark keys we want to expose for runtime lookups
            const LM = [
              'ash_wednesday',
              'septuagesima', 'sexagesima', 'quinquagesima',
              'palm_sunday', 'holy_thursday', 'good_friday', 'holy_saturday',
              'easter', 'easter_sunday', 'low_sunday',
              'ascension', 'pentecost', 'holy_trinity', 'corpus_christi', 'sacred_heart',
              'christ_the_king',
              'christmas_day', 'octave_day_of_christmas', 'sunday_in_octave_of_christmas',
              'epiphany', 'holy_family', 'holy_name_of_jesus'
            ];
            if (LM.some((t) => keyNorm.includes(t))) POT_MAP[key] = Array.from(new Set(pages2));
            // Seasonal Sundays like first/second/third/fourth
            const ORD = { first:1, second:2, third:3, fourth:4, fifth:5 };
            const mSun = keyNorm.match(/^(first|second|third|fourth|fifth)_sunday$/);
            if (mSun) {
              const n = ORD[mSun[1]];
              const sec = secName && String(secName).toLowerCase().replace(/\s+/g,'_');
              if (n && sec) POT_MAP[`${sec}_sunday_${n}`] = Array.from(new Set(pages2));
            }
            // Generic keys like sunday_1, sunday_2
            const mSun2 = keyNorm.match(/^sunday_(\d+)$/);
            if (mSun2) {
              const n = Number(mSun2[1]);
              const sec = secName && String(secName).toLowerCase().replace(/\s+/g,'_');
              if (n && sec) POT_MAP[`${sec}_sunday_${n}`] = Array.from(new Set(pages2));
            }
          }
        }
      }
    }
    if (addedPOT) console.log(`${check} LU_proper_of_time → EF day pages: ${addedPOT}`);
    // Emit micro potIndex.js for runtime seasonal/landmark pages
    await writeModuleIfChanged(potIndexJsPath, { _meta: { generatedAt: new Date().toISOString() }, pages: POT_MAP });
  } catch (e) {
    console.warn(`${warn} skip LU_proper_of_time: ${e?.message || e}`);
  }

  // Write indices (idempotent)
  // Ensure target shape for downstream resolvers/consumers
  function ensureShape(rec) {
    if (!rec || typeof rec !== 'object') return rec;
    if (!('propers' in rec)) rec.propers = [];
    if (!('ordinary' in rec)) rec.ordinary = {};
    if (!('hymns' in rec)) rec.hymns = {};
    if (!('rank' in rec)) rec.rank = null; // EF rank code: 't'|'s'|'f'|'m'|'o'
    if (!('season' in rec)) rec.season = null; // season hint if determinable for fixed days
    if (!('weekday' in rec)) rec.weekday = null; // 'dominica'|'feria' when known
    return rec;
  }
  function classToRankCode(cls, typeHint) {
    const s = String(cls || '').toUpperCase();
    if (/^I\b/.test(s)) return 's';
    if (/^II\b/.test(s)) return 'f';
    if (/^III\b/.test(s)) return 'm';
    if (/^IV\b/.test(s)) return 'o';
    const th = String(typeHint || '').toLowerCase();
    if (th.includes('commem')) return 'o';
    return null;
  }
  function seasonHintFromMMDD(mmdd) {
    // Only fixed, year-agnostic hints we can assert confidently
    // Advent: Dec 17–24; Christmastide: Dec 25–Jan 13
    if (!/^\d{2}-\d{2}$/.test(mmdd)) return null;
    const [m, d] = mmdd.split('-').map((x) => Number(x));
    if (m === 12 && d >= 17 && d <= 24) return 'ad';
    if ((m === 12 && d >= 25) || (m === 1 && d <= 13)) return 'ct';
    return null;
  }
  function weekdayFromTypeHint(th) {
    const s = String(th || '').toLowerCase();
    if (s.includes('sunday')) return 'dominica';
    if (s.includes('feria')) return 'feria';
    return null;
  }
  // Normalize EF table entries to ensure shape (supports arrays for multiple same-day items)
  if (index.EF && typeof index.EF === 'object') {
    for (const k of Object.keys(index.EF)) {
      const v = index.EF[k];
      if (Array.isArray(v)) index.EF[k] = v.map((rec) => {
        const out = ensureShape(rec);
        out.rank = classToRankCode(out.class || out.class_rank, out.type_hint);
        if (out.season == null) out.season = seasonHintFromMMDD(k);
        // Never emit weekday in dayIndex; resolve at runtime when needed
        delete out.weekday;
        // Drop verbose/raw fields not needed in final lookup output
        delete out.type; // from calendar overlay
        delete out.season; // remove until YMD-specific season is available
        delete out.class_rank;
        delete out.raw_class;
        delete out.type_hint;
        delete out.rank; // rank retained in calendar via feastId; resolve at runtime
        delete out._from;
        delete out.source;
        return out;
      });
      else {
        const out = ensureShape(v);
        out.rank = classToRankCode(out.class || out.class_rank, out.type_hint);
        if (out.season == null) out.season = seasonHintFromMMDD(k);
        // Never emit weekday in dayIndex; resolve at runtime when needed
        delete out.weekday;
        // Drop verbose/raw fields not needed in final lookup output
        delete out.type; // from calendar overlay
        delete out.season; // remove until YMD-specific season is available
        delete out.class_rank;
        delete out.raw_class;
        delete out.type_hint;
        delete out.rank; // rank retained in calendar via feastId; resolve at runtime
        delete out._from;
        delete out.source;
        index.EF[k] = out;
      }
    }
    // Rebuild with sorted keys for readability
    const sorted = {};
    Object.keys(index.EF)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      .forEach((k) => (sorted[k] = index.EF[k]));
    index.EF = sorted;
  }

  // Overlay from festal calendar (fixed days) to add feastId/title/rank/type when available
  try {
    const calPath = path.join(repoRoot, 'src', 'festum', 'data', 'calendar.json');
    const cal = JSON.parse(await fs.readFile(calPath, 'utf8'));
    const fixed = new Map();
    for (const e of cal) {
      const hasMD = Number.isInteger(e?.month) && Number.isInteger(e?.day) && e.day > 0;
      const isFixed = e?.type === 'fixed' || (e?.type == null && hasMD);
      if (!isFixed) continue;
      const key = `${pad2((e.month ?? 0) + 1)}-${pad2(e.day)}`;
      fixed.set(key, e);
    }
    let overlayCount = 0;
    for (const k of Object.keys(index.EF)) {
      const E = fixed.get(k);
      if (!E) continue;
      const val = index.EF[k];
      const arr = Array.isArray(val) ? val : [val];
      for (const rec of arr) {
        // add fields if missing; do not overwrite explicit values from /etc unless empty
        if (!('feastId' in rec) || !rec.feastId) rec.feastId = E.id || null;
        // Only allow overlay to set title for LU calendar-derived records or when empty/'Feria'
        if ((rec._from === 'lu_calendar' && (!rec.title || rec.title === 'Feria')) || (!rec.title || rec.title === 'Feria')) {
          rec.title = normalizeTitle(E.title || rec.title);
        }
        if (!rec.title_la && E.title_la) rec.title_la = E.title_la;
        // Do not persist rank/type here; keep dayIndex lean
        if (rec.rank != null) delete rec.rank;
        if (rec.type != null) delete rec.type;
        // no weekday here; leave unset unless derived elsewhere
        overlayCount++;
      }
      if (!Array.isArray(val)) index.EF[k] = arr[0];
    }
    console.log(`${check} calendar overlay → ${overlayCount} EF record(s)`);
  } catch (e) {
    console.warn(`${warn} calendar overlay skipped: ${e?.message || e}`);
  }

  // Resolver pass: populate propers (by office) from LU by page ranges where available
  try {
    const luPath = path.join(repoRoot, 'src', 'cantus', 'data', 'liber_usualis.js');
    const luRows = (await import(url.pathToFileURL(luPath).href)).default;
    const MASS_OFFICES = new Set(['in','gr','al','tr','of','co','se']);
    const toNum = (s) => {
      if (s == null) return null;
      const m = String(s).match(/\d{1,4}/);
      return m ? Number(m[0]) : null;
    };
    const byPage = new Map(); // number -> rows[]
    for (const r of luRows) {
      const code = String(r?.office?.code || '').toLowerCase();
      if (!MASS_OFFICES.has(code)) continue;
      const pages = (r?.meta?.pages || []).map(p => toNum(p?.page)).filter(n => Number.isFinite(n));
      for (const n of pages) {
        const arr = byPage.get(n) || [];
        arr.push(r);
        byPage.set(n, arr);
      }
    }
    const pushByOffice = (obj, office, id) => {
      if (!office) return;
      const key = office.toLowerCase();
      if (!obj[key]) obj[key] = [];
      if (!obj[key].includes(id)) obj[key].push(id);
    };
    const pagesFromHints = (rec) => {
      const s = new Set();
      // from explicit propers_pages ranges
      const ranges = Array.isArray(rec.propers_pages) ? rec.propers_pages : [];
      for (const r of ranges) {
        if (typeof r === 'number') s.add(r);
        else if (r && Number.isFinite(r.from) && Number.isFinite(r.to)) {
          for (let n = r.from; n <= r.to; n++) s.add(n);
        }
      }
      // from LU calendar pages strings
      const calPages = Array.isArray(rec.pages) ? rec.pages : [];
      for (const p of calPages) {
        const n = toNum(p);
        if (Number.isFinite(n)) {
          s.add(n);
          // include adjacent pages for common multi-page spreads
          s.add(n - 1);
          s.add(n + 1);
        }
      }
      return Array.from([...s].filter((n) => Number.isFinite(n) && n > 0)).sort((a,b)=>a-b);
    };
    let recsUpdated = 0, idsAdded = 0;
    for (const k of Object.keys(index.EF)) {
      const val = index.EF[k];
      const arr = Array.isArray(val) ? val : [val];
      for (const rec of arr) {
        const pages = pagesFromHints(rec);
        if (!pages.length) continue;
        const priorCount = rec.propers && typeof rec.propers === 'object'
          ? Object.values(rec.propers).reduce((a, v) => a + (Array.isArray(v) ? v.length : 0), 0)
          : (Array.isArray(rec.propers) ? rec.propers.length : 0);
        const byOffice = {};
        for (const p of pages) {
          const rows = byPage.get(p) || [];
          for (const row of rows) {
            const office = String(row?.office?.code || '').toLowerCase();
            const id = row.id;
            pushByOffice(byOffice, office, id);
          }
        }
        // Limit per office to a few most-local items based on page proximity
        const score = (id, office) => {
          // compute min delta between this row's pages and hint pages
          const row = luRows.find((r) => r.id === id);
          const rowPages = (row?.meta?.pages || []).map((p)=>toNum(p?.page)).filter(Number.isFinite);
          let best = 1e9;
          for (const rp of rowPages) for (const hp of pages) best = Math.min(best, Math.abs(rp - hp));
          return best;
        };
        const MAX_PER_OFFICE = 4;
        const sortedByOffice = {};
        for (const [off, ids] of Object.entries(byOffice)) {
          const sorted = ids
            .map((id) => ({ id, s: score(id, off) }))
            .sort((a, b) => a.s - b.s)
            .slice(0, MAX_PER_OFFICE)
            .map((x) => x.id);
          if (sorted.length) sortedByOffice[off] = sorted;
        }
        if (Object.keys(sortedByOffice).length) {
          rec.propers = sortedByOffice;
          const afterCount = Object.values(sortedByOffice).reduce((a, v) => a + v.length, 0);
          if (afterCount > priorCount) {
            recsUpdated++;
            idsAdded += (afterCount - priorCount);
          }
        }
      }
    }
    console.log(`${check} propers: +${idsAdded} LU id(s) across ${recsUpdated} EF record(s)`);
  } catch (e) {
    console.warn(`${warn} LU pages resolver skipped: ${e?.message || e}`);
  }

  // Hymn resolver (EF): map feast pages to LH IDs (and optionally incipits)
  try {
    const lhPath = path.join(repoRoot, 'src', 'cantus', 'data', 'liber_hymnarius.js');
    const amPath = path.join(repoRoot, 'src', 'cantus', 'data', 'antiphonale_monasticum.js');
    const LH = (await import(url.pathToFileURL(lhPath).href)).default;
    const AM = (await import(url.pathToFileURL(amPath).href)).default;
    const norm = (s = '') =>
      String(s)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    const toNum = (s) => {
      if (s == null) return null;
      const m = String(s).match(/\d{1,4}/);
      return m ? Number(m[0]) : null;
    };
    const byIncLH = new Map();
    for (const r of LH) {
      const inc = norm(r?.incipit || '');
      if (!inc) continue;
      const arr = byIncLH.get(inc) || [];
      arr.push(r.id);
      byIncLH.set(inc, arr);
    }
    const byIncAM = new Map();
    for (const r of AM) {
      const inc = norm(r?.incipit || '');
      if (!inc) continue;
      const arr = byIncAM.get(inc) || [];
      arr.push(r.id);
      byIncAM.set(inc, arr);
    }
    // LH pages -> IDs map (now that LH has meta.pages)
    const byPageLH = new Map();
    for (const r of LH) {
      const pages = (r?.meta?.pages || []).map(p => toNum(p?.page)).filter(n => Number.isFinite(n));
      for (const n of pages) {
        const arr = byPageLH.get(n) || [];
        arr.push(r.id);
        byPageLH.set(n, arr);
      }
    }
    let recsHymnUpdated = 0, hymnIdsAdded = 0;
    function collectForIncipits(list = []) {
      const out = [];
      for (const inc of list) {
        const k = norm(inc);
        const lh = byIncLH.get(k) || [];
        const am = byIncAM.get(k) || [];
        out.push(...lh, ...am);
      }
      return Array.from(new Set(out));
    }
    // Optional: feast-page mapping from etc/LH_feast_pages.json to set hymns_pages and IDs by page
    let lhFeastPages = [];
    try {
      lhFeastPages = JSON.parse(await fs.readFile(path.join(etcDir, 'LH_feast_pages.json'), 'utf8'));
    } catch {}
    // Build robust label matcher (Latin tokens, diacritics removed, light stemming, stopwords)
    const latinNorm = (s='') => String(s)
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^A-Za-z\s&]/g,' ')
      .replace(/\bJ/g,'I').replace(/\bj/g,'i')
      .replace(/\s+/g,' ').trim().toLowerCase();
    const stop = new Set(['s','ss','sancti','sanctae','sanctus','sanctorum','beati','beatae','beatus','in','de','et','cum','sociorum','ecclesiae','doctoris','confessoris','martyris','martyrum','virginis','episcopi','presbyteri','abbatis','apostoli','evangelistae','protomartyris','religiosae']);
    const stem = (t)=> t.replace(/(orum|arum|ibus|ium|ius|ae|is|us|um|am|as|os|e|i|es)$/,'');
    const tokens = (s)=> latinNorm(s).split(/[\s&]+/).filter(Boolean).map(stem).filter((t)=> t.length>1 && !stop.has(t));
    const pageLabelToPages = Array.isArray(lhFeastPages) ? lhFeastPages.map((r)=>({ label: r?.label||'', pages: (Array.isArray(r?.pages)? r.pages:[]).map(Number).filter(Number.isFinite)})) : [];
    function matchPagesForRecord(rec) {
      const keyStrs = [rec.title_la, rec.title].filter(Boolean);
      const keyTokens = Array.from(new Set(keyStrs.flatMap(tokens)));
      if (!keyTokens.length) return [];
      let best = null;
      for (const row of pageLabelToPages) {
        const labTokens = Array.from(new Set(tokens(row.label)));
        if (!labTokens.length || !row.pages?.length) continue;
        // overlap score
        let score = 0;
        for (const t of labTokens) if (keyTokens.includes(t)) score++;
        if (score > 0 && (!best || score > best.score)) best = { score, pages: row.pages };
      }
      return best ? best.pages : [];
    }

    for (const k of Object.keys(index.EF)) {
      const val = index.EF[k];
      const arr = Array.isArray(val) ? val : [val];
      for (const rec of arr) {
        if (!rec.hymns || typeof rec.hymns !== 'object') rec.hymns = {};
        let changed = 0;
        // Populate from LH pages if we can match feast label → pages
        const pages = matchPagesForRecord(rec);
        if (pages.length) {
          function idsForPages(pgList, alsoCollectPages = false) {
            const acc = [];
            const used = new Set();
            for (const p of pgList) {
              const ids = byPageLH.get(p) || [];
              if (ids.length) {
                acc.push(...ids);
                if (alsoCollectPages) used.add(p);
              }
            }
            return { ids: Array.from(new Set(acc)), usedPages: Array.from(used) };
          }
          const MAX_HYMN_IDS = 6;
          // Try exact pages first
          let { ids: idsFromPages, usedPages } = idsForPages(pages, true);
          // Fallback: ±1 only if exact empty
          if (!idsFromPages.length) {
            const near1 = Array.from(new Set(pages.flatMap((p)=>[p-1,p+1]).filter((n)=>Number.isFinite(n) && n>0)));
            const res1 = idsForPages(near1, true);
            idsFromPages = res1.ids;
            usedPages = res1.usedPages;
          }
          // Fallback: ±2 only if still empty
          if (!idsFromPages.length) {
            const near2 = Array.from(new Set(pages.flatMap((p)=>[p-2,p+2]).filter((n)=>Number.isFinite(n) && n>0)));
            const res2 = idsForPages(near2, true);
            idsFromPages = res2.ids;
            usedPages = res2.usedPages;
          }
          // Record only the pages that actually yielded IDs
          if (usedPages && usedPages.length) {
            rec.hymns_pages = Array.from(new Set([...(rec.hymns_pages || []), ...usedPages]));
          } else {
            // keep original hint pages if nothing produced IDs
            rec.hymns_pages = Array.from(new Set([...(rec.hymns_pages || []), ...pages]));
          }
          if (idsFromPages.length) {
            const prev = Array.isArray(rec.hymns.lh) ? rec.hymns.lh : [];
            let merged = Array.from(new Set([...prev, ...idsFromPages]));
            if (merged.length > MAX_HYMN_IDS) merged = merged.slice(0, MAX_HYMN_IDS);
            hymnIdsAdded += Math.max(0, merged.length - prev.length);
            rec.hymns.lh = merged;
            changed++;
          }
        }
        // Incipit-based matching can be added here using Latin incipits from LH/AM when a day-to-incipit map is available
        if (changed) recsHymnUpdated++;
      }
    }
    console.log(`${check} hymns: +${hymnIdsAdded} candidates across ${recsHymnUpdated} EF record(s)`);
  } catch (e) {
    console.warn(`${warn} hymn resolver skipped: ${e?.message || e}`);
  }

  async function writeIfChanged(p, obj) {
    const next = JSON.stringify(obj, null, 2) + '\n';
    let prev = null;
    try { prev = await fs.readFile(p, 'utf8'); } catch {}
    if (prev === next) {
      console.log(`${gray('unchanged')} ${gray(path.relative(repoRoot, p))}`);
      return 'unchanged';
    }
    await fs.writeFile(p, next, 'utf8');
    console.log(`${check} wrote ${gray(path.relative(repoRoot, p))}`);
    return 'written';
  }
  async function writeModuleIfChanged(p, obj) {
    const next = 'export default ' + JSON.stringify(obj, null, 2) + '\n';
    let prev = null;
    try { prev = await fs.readFile(p, 'utf8'); } catch {}
    if (prev === next) {
      console.log(`${gray('unchanged')} ${gray(path.relative(repoRoot, p))}`);
      return 'unchanged';
    }
    await fs.writeFile(p, next, 'utf8');
    console.log(`${check} wrote ${gray(path.relative(repoRoot, p))}`);
    return 'written';
  }

  if (EMIT_JSON) {
    await writeIfChanged(dayIndexJsonPath, index);
  } else {
    await writeModuleIfChanged(dayIndexJsPath, index);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
