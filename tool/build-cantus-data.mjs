#!/usr/bin/env node
// tool/build-cantus-data.mjs — preprocess raw gregobase files into normalized corpora
// - Normalizes Antiphonale_Monasticum into src/cantus/data/antiphonale_monasticum.json
// - Enriches with page references from chant_sources.json
// - Links to source metadata from sources.json

import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// pretty logging
const TTY = process.stdout.isTTY || process.env.FORCE_COLOR === '1';
const C = (code) => (s) => (TTY ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const bold = C(1), green = C(32), cyan = C(36), yellow = C(33), gray = C(90);
const check = green('✓');
const warn = yellow('!');
const bullet = cyan('•');
function header(title){ const line = gray('─'.repeat(Math.max(3, 60 - title.length))); console.log(`${bold(title)} ${line}`); }

async function readJSON(p) {
  const txt = await fs.readFile(p, 'utf8');
  return JSON.parse(txt);
}

function norm(s = '') {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

async function buildAll() {
  const gbDir = path.join(repoRoot, 'gregobase');
  const outDir = path.join(repoRoot, 'src', 'cantus', 'data');
  await fs.mkdir(outDir, { recursive: true });

  const entries = await fs.readdir(gbDir);
  header('Build: Cantus Data');
  console.log(`${bullet} gregobase entries: ${cyan(entries.length)}`);
  const normName = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
  const findFileToken = (token) => entries.find((e) => normName(e).includes(token));

  // Load shared gregobase indices once
  // Locate sources and chant_sources files (case/format agnostic)
  const sourcesFile = entries.find((e) => {
    const n = normName(e);
    return n.includes('sources') && !n.includes('chant');
  });
  const chantSourcesFile = entries.find((e) => {
    const n = normName(e);
    return n.includes('chant') && n.includes('sources');
  });
  if (!sourcesFile || !chantSourcesFile) {
    console.log('[build:data] Could not locate sources or chant_sources JSON in /gregobase');
  }
  const sources = sourcesFile ? await readJSON(path.join(gbDir, sourcesFile)) : [];
  const chantSources = chantSourcesFile ? await readJSON(path.join(gbDir, chantSourcesFile)) : [];
  const sourcesById = new Map(sources.map((s) => [Number(s.id), s]));

  const processors = [];
  const corpusRows = { AM: [], LH: [], LU: [], GR: [], GR74: [] };

  // Generic processor factory
  function findSourceEntryByTitle(sources, title) {
    const normTitle = (s='') => norm(String(s).replace(/^the\s+/, ''));
    const w = normTitle(title);
    // exact or contains match
    let best = sources.find((s) => normTitle(s.title) === w);
    if (!best) best = sources.find((s) => normTitle(s.title).includes(w));
    if (!best) best = sources.find((s) => w.includes(normTitle(s.title)));
    return best || null;
  }

  function makeProcessor({ rawFile, sourceTitle, outFile, defaultOffice = 'in', corpusKey }) {
    return async () => {
      const raw = await readJSON(path.join(gbDir, rawFile));
      const srcEntry = findSourceEntryByTitle(sources, sourceTitle);
      const SRC_ID = srcEntry ? Number(srcEntry.id) : null;
      const pagesByChant = new Map();
      if (SRC_ID != null) {
        for (const r of chantSources) {
          if (Number(r.source) !== SRC_ID) continue;
          const cid = Number(r.chant_id);
          const arr = pagesByChant.get(cid) || [];
          arr.push({ page: String(r.page), sequence: Number(r.sequence||0), extent: Number(r.extent||0) });
          pagesByChant.set(cid, arr);
        }
      }
      const srcMeta = SRC_ID != null ? sourcesById.get(SRC_ID) : null;
      const out = raw.map((r) => {
        const idNum = Number(r.id);
        return {
          id: `${sourceTitle.replace(/\s+/g,'_')}:${idNum}`,
          incipit: r.incipit || '',
          source: {
            id: SRC_ID,
            name: sourceTitle,
            year: srcMeta?.year ?? null,
            editor: srcMeta?.editor ?? null,
          },
          office: { code: String(r['office-part'] || defaultOffice) },
          chant: { mode: r.mode != null ? String(r.mode) : '', gabc: r.gabc || '' },
          meta: { pages: pagesByChant.get(idNum) || [] },
        };
      });
      const outPath = path.join(outDir, outFile.replace(/\.json$/i, '.js'));
      const modSrc = 'export default ' + JSON.stringify(out, null, 2) + '\n';
      await fs.writeFile(outPath, modSrc, 'utf8');
      console.log(`${check} wrote ${cyan(out.length)} rows → ${gray(path.relative(repoRoot, outPath))}`);
      // accumulate for merging
      if (corpusKey && Array.isArray(corpusRows[corpusKey])) corpusRows[corpusKey].push(...out);
      return { file: outPath, rows: out.length, corpus: corpusKey };
    };
  }

  // Antiphonale Monasticum → antiphonale_monasticum.json
  {
    const f = findFileToken('antiphonalemonasticum') || entries.find((e)=>normName(e)==='amjson');
    console.log(`${bullet} AM token: ${f ? green(f) : gray('none')}`);
    if (f) {
    processors.push(makeProcessor({
      rawFile: f,
      sourceTitle: 'Antiphonale Monasticum',
      outFile: 'antiphonale_monasticum.json',
      defaultOffice: 'hy',
      corpusKey: 'AM',
    }));
    }
  }

  // Liber Hymnarius → liber_hymnarius.json
  {
    const f = entries.find((e)=>/\.json$/i.test(e) && normName(e).includes('liberhymnarius'))
            || entries.find((e)=> normName(e) === 'lhjson');
    console.log(`${bullet} LH token: ${f ? green(f) : gray('none')}`);
    if (f) {
    processors.push(makeProcessor({
      rawFile: f,
      sourceTitle: 'Liber Hymnarius',
      outFile: 'liber_hymnarius.json',
      defaultOffice: 'hy',
      corpusKey: 'LH',
    }));
    }
  }

  // Liber Usualis → liber_usualis.json
  {
    const f = findFileToken('liberusualis') || entries.find((e)=>normName(e)==='lujson');
    console.log(`${bullet} LU token: ${f ? green(f) : gray('none')}`);
    if (f) {
    processors.push(makeProcessor({
      rawFile: f,
      sourceTitle: 'Liber Usualis',
      outFile: 'liber_usualis.json',
      defaultOffice: 'in',
      corpusKey: 'LU',
    }));
    }
  }

  // Graduale Romanum (1908) → graduale_romanum.json
  {
    // Prefer GR (not GR74)
    const f = findFileToken('gradualeromanum') || entries.find((e)=> normName(e)==='grjson');
    console.log(`${bullet} GR token: ${f ? green(f) : gray('none')}`);
    if (f) {
    processors.push(makeProcessor({
      rawFile: f,
      sourceTitle: 'Graduale Romanum',
      outFile: 'graduale_romanum.json',
      defaultOffice: 'in',
      corpusKey: 'GR',
    }));
    }
  }

  // Graduale Romanum 1974 → graduale_romanum_1974.json
  {
    const f = findFileToken('gradualeromanum1974') || entries.find((e)=> normName(e)==='gr74json');
    console.log(`${bullet} GR1974 token: ${f ? green(f) : gray('none')}`);
    if (f) {
    processors.push(makeProcessor({
      rawFile: f,
      sourceTitle: 'Graduale Romanum 1974',
      outFile: 'graduale_romanum_1974.json',
      defaultOffice: 'in',
      corpusKey: 'GR74',
    }));
    }
  }

  const results = [];
  for (const fn of processors) {
    try {
      const res = await fn();
      if (res) results.push(res);
    } catch (e) {
      console.error('Processor failed:', e?.message || e);
    }
  }
  const total = results.reduce((a, r) => a + (r.rows || 0), 0);
  if (results.length) {
    console.log(`\n${check} build complete: ${cyan(results.length)} dataset(s), ${cyan(total)} total rows`);
    for (const r of results) console.log(`  ${check} ${gray(path.relative(repoRoot, r.file))} (${cyan(r.rows)})`);
  } else {
    console.log(`${warn} no datasets processed — check /gregobase for raw files`);
  }

  // Merge: LU > GR > GR74 > LH > AM — produce flat alias map
  function stripTags(s='') { return String(s).replace(/<[^>]*>/g, ''); }
  function stripSpace(s='') { return String(s).replace(/[\s\u200b\u200c\u200d]+/g, ''); }
  function stripDiacritics(s='') { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function sig(row){
    const inc = stripDiacritics(String(row.incipit||'')).toLowerCase();
    const mode = String(row?.chant?.mode || '');
    const gabc = stripSpace(stripTags(String(row?.chant?.gabc || '')));
    const hash = crypto.createHash('sha1').update(gabc).digest('hex').slice(0,16);
    return `${inc}|${mode}|${hash}`;
  }

  const order = ['LU','GR','GR74','LH','AM'];
  const alias = {}; // flat map aliasId -> canonicalId
  const canonical = new Map(); // key -> row
  for (const k of order) {
    for (const r of corpusRows[k]) {
      const key = sig(r);
      if (!canonical.has(key)) {
        canonical.set(key, r);
      } else {
        const can = canonical.get(key);
        if (r.id !== can.id) alias[r.id] = can.id;
      }
    }
  }
  const aliasPath = path.join(outDir, 'aliases.js');
  await fs.writeFile(aliasPath, 'export default ' + JSON.stringify(alias, null, 2) + '\n', 'utf8');
  console.log(`${check} aliases: ${cyan(Object.keys(alias).length)} → ${gray(path.relative(repoRoot, aliasPath))}`);

  // Kyriale canonicalization (JS module): remap IDs in kyriale.js via alias, report changes
  const kyrPathJs = path.join(repoRoot, 'src', 'cantus', 'data', 'kyriale.js');
  try {
    const kyMod = await import(url.pathToFileURL(kyrPathJs).href);
    const ky = kyMod.default || {};
    let changes = 0, totalIds = 0;
    const remapList = (arr=[]) => Array.from(new Set(arr.map((id)=> alias[id] || id)));
    const outKy = {};
    for (const mass in ky) {
      outKy[mass] = {};
      for (const part in ky[mass]) {
        const before = ky[mass][part] || [];
        const after = remapList(before);
        totalIds += before.length;
        if (JSON.stringify(before) !== JSON.stringify(after)) changes++;
        outKy[mass][part] = after;
      }
    }
    const changed = JSON.stringify(ky) !== JSON.stringify(outKy);
    if (changed) {
      const modSrc = 'export default ' + JSON.stringify(outKy, null, 2) + '\n';
      await fs.writeFile(kyrPathJs, modSrc, 'utf8');
      console.log(`${check} kyriale canonicalized (${cyan(changes)} part list(s)), scanned ${cyan(totalIds)} ids`);
    } else {
      console.log(gray('kyriale already canonical w.r.t alias map'));
    }
  } catch (e) {
    console.log(gray('kyriale not found or invalid; skipped canonicalization'));
  }

  // Rewrite canonical-only outputs for non-LU corpora (drop aliased rows)
  const fileMap = {
    GR: 'graduale_romanum.js',
    GR74: 'graduale_romanum_1974.js',
    LH: 'liber_hymnarius.js',
    AM: 'antiphonale_monasticum.js',
  };
  for (const key of Object.keys(fileMap)) {
    const list = corpusRows[key];
    if (!Array.isArray(list) || !list.length) continue;
    const kept = list.filter((r) => {
      const keySig = sig(r);
      const can = canonical.get(keySig);
      return can && can.id === r.id;
    });
    const outPath = path.join(outDir, fileMap[key]);
    await fs.writeFile(outPath, 'export default ' + JSON.stringify(kept, null, 2) + '\n', 'utf8');
    console.log(`Canonical-only rewrite: ${path.relative(repoRoot, outPath)} (${kept.length}/${list.length})`);
  }

  // LH English adaptation rules removed from build (no longer used)
}

async function main() {
  await buildAll();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
