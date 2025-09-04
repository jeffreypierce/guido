#!/usr/bin/env node
// tool/bake-json.mjs — emit ESM data modules from JSON files
// For each src/**/data/*.json, writes a sibling *.js with `export default <json>`

import fs from 'node:fs/promises';
import path from 'node:path';

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const fmtBytes = (n) => {
  const units = ['B','KB','MB','GB'];
  let i = 0, x = Number(n);
  while (x >= 1024 && i < units.length - 1) { x /= 1024; i++; }
  return `${x.toFixed(i ? 1 : 0)}${units[i]}`;
};

async function readIfExists(p) {
  try { return await fs.readFile(p, 'utf8'); }
  catch { return null; }
}

async function main() {
  const root = path.resolve(process.cwd(), 'src');
  const targets = [];
  for await (const p of walk(root)) {
    if (!/\bdata\b/.test(p)) continue;
    if (!p.endsWith('.json')) continue;
    targets.push(p);
  }
  if (!targets.length) {
    console.log('[bake-json] No JSON files found under src/**/data');
    return;
  }

  let created = 0, updated = 0, unchanged = 0;
  let totalJsonBytes = 0, totalJsBytes = 0;

  for (const jsonPath of targets) {
    const jsPath = jsonPath.replace(/\.json$/, '.js');
    const raw = await fs.readFile(jsonPath, 'utf8');
    totalJsonBytes += Buffer.byteLength(raw, 'utf8');
    // Validate JSON early
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) {
      console.error(`[bake-json] Invalid JSON: ${path.relative(process.cwd(), jsonPath)}`);
      throw e;
    }
    const moduleSrc = 'export default ' + JSON.stringify(parsed) + '\n';
    const prev = await readIfExists(jsPath);

    let status;
    if (prev == null) {
      status = 'created';
      created++;
      await fs.writeFile(jsPath, moduleSrc, 'utf8');
    } else if (prev !== moduleSrc) {
      status = 'updated';
      updated++;
      await fs.writeFile(jsPath, moduleSrc, 'utf8');
    } else {
      status = 'unchanged';
      unchanged++;
    }

    const jsBytes = Buffer.byteLength(prev == null ? moduleSrc : await readIfExists(jsPath) ?? moduleSrc, 'utf8');
    totalJsBytes += jsBytes;

    const relJson = path.relative(process.cwd(), jsonPath);
    const relJs = path.relative(process.cwd(), jsPath);
    const kind = Array.isArray(parsed)
      ? `array(${parsed.length})`
      : parsed && typeof parsed === 'object'
        ? `object(${Object.keys(parsed).length})`
        : typeof parsed;
    console.log(`[bake-json] ${status.toUpperCase()} ${relJs} ← ${relJson} — ${kind} — json ${fmtBytes(Buffer.byteLength(raw))}, js ${fmtBytes(jsBytes)}`);
  }

  console.log(`\n[bake-json] Summary: ${created} created, ${updated} updated, ${unchanged} unchanged — json ${fmtBytes(totalJsonBytes)}, js ${fmtBytes(totalJsBytes)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
