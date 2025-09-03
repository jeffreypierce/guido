// tests/run.js — zero-dep, colorful test runner (ESM)
const TTY = process.stdout.isTTY || process.env.FORCE_COLOR === '1';
const C = (code) => (TTY ? (s) => `\x1b[${code}m${s}\x1b[0m` : (s) => String(s));
const bold = C(1), dim = C(2), red = C(31), green = C(32), cyan = C(36), gray = C(90), magenta = C(35);

const check  = green('✓');
const cross  = red('✗');
const bullet = cyan('▶︎');

function header(title) {
  const line = gray('─'.repeat(Math.max(3, 60 - title.length)));
  console.log(`${bold(title)} ${line}`);
}
function ms(n) { return gray(`${n.toFixed(0)}ms`); }

export const tests = [];
export const it = (name, fn) => tests.push({ name, fn });
export const assert = (cond, msg = 'assertion failed') => { if (!cond) throw new Error(msg); };
export const d = (y, m, day) => new Date(Date.UTC(y, m - 1, day));

globalThis.it = it;
globalThis.assert = assert;
globalThis.d = d;

function _section(title) { console.log('\n' + magenta(`— ${title} —`)); }
globalThis.section = _section;
globalThis.banner = _section;
globalThis.subsection = (t) => console.log('\n' + cyan(`• ${t}`));

import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const entries = await fs.readdir(__dirname);
const suites = entries.filter(f => /^suite\..*\.js$/.test(f)).sort();

if (suites.length === 0) {
  console.error(red('No test suites found in tests/. Expected files like suite.core.js'));
  process.exit(1);
}

header('Loading test suites');
for (const f of suites) {
  console.log(`${bullet} ${f}`);
  const p = path.join(__dirname, f);
  await import(url.pathToFileURL(p).href);
}
console.log('');

header('Running tests');
let pass = 0, fail = 0;
const t0 = process.hrtime.bigint();

for (const t of tests) {
  const s0 = process.hrtime.bigint();
  try {
    await t.fn();
    const dt = Number(process.hrtime.bigint() - s0) / 1e6;
    console.log(`${check} ${t.name} ${ms(dt)}`);
    pass++;
  } catch (e) {
    const dt = Number(process.hrtime.bigint() - s0) / 1e6;
    console.error(`${cross} ${t.name} ${ms(dt)}\n  ${red(e.message)}`);
    if (e.stack) {
      const lines = String(e.stack).split('\n').slice(1, 3).map(s => s.trim());
      if (lines.length) console.error('  ' + dim(lines.join('\n  ')));
    }
    fail++;
  }
}

const dtAll = Number(process.hrtime.bigint() - t0) / 1e6;
console.log('');
header('Summary');
const sum = `${green(String(pass) + ' passed')}, ` +
            `${fail ? red(String(fail) + ' failed') : green('0 failed')} ` +
            gray(`in ${dtAll.toFixed(0)}ms`);
console.log(sum);

if (fail) process.exit(1);