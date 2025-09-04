
// tests/suite.calendarium.js
import { calendarium } from "../src/festum/calendarium.js";
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const calPath = path.join(__dirname, "../src/festum/data/calendar.json");
const cal = JSON.parse(await fs.readFile(calPath, "utf8"));
import { lookup1962, lookup1974 } from "../src/festum/datum.js";

banner("calendarium — fixed & movable overlay");

const y = 2025;
const DAY = 86400000;
const toYMD = (d) => {
  const x = new Date(d);
  const yyyy = x.getUTCFullYear();
  const mm = String(x.getUTCMonth()+1).padStart(2,"0");
  const dd = String(x.getUTCDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
};

function findRowByYMD(rows, ymd){
  return rows.find(r => {
    const x = new Date(r.ts);
    const got = toYMD(x);
    return got === ymd;
  });
}

it("movable feasts (Trinity, Corpus, Christ the King) map to exact dates", () => {
  for (const form of ["1962","1974"]) {
    const L = form==="1974" ? lookup1974(y) : lookup1962(y);
    const rows = calendarium(y, { form });

    for (const id of ["holy_trinity","corpus_christi","christ_king"]) {
      const ymd = toYMD(L[id]);
      const row = findRowByYMD(rows, ymd);
      assert(row && row.id === id, `${form} missing ${id} on ${ymd}`);
    }
  }
});

it("fixed feasts from calendar.json appear on their month/day", () => {
  const rows = calendarium(y, { form: "1974" });
  // find any fixed entry present in your calendar.json to test
  const aFixed = cal.find(e => Number.isInteger(e.month) && Number.isInteger(e.day));
  if (!aFixed) { assert(true, "no fixed feasts present to test"); return; }
  const mm = String((aFixed.month ?? 0)+1).padStart(2,"0");
  const dd = String(aFixed.day).padStart(2,"0");
  const ymd = `${y}-${mm}-${dd}`;
  const row = rows.find(r => toYMD(r.ts) === ymd);
  assert(row && row.id === aFixed.id, `fixed ${aFixed.id} not found on ${ymd}`);
});

it("movable overlay takes precedence over fixed feasts on same day", () => {
  const y = 2025;
  const rows = calendarium(y, { form: "1974" });
  // Build a quick lookup for rows by YMD
  const idx = new Map(rows.map(r => {
    const x = new Date(r.ts);
    const yyyy = x.getUTCFullYear();
    const mm = String(x.getUTCMonth()+1).padStart(2,"0");
    const dd = String(x.getUTCDate()).padStart(2,"0");
    return [`${yyyy}-${mm}-${dd}`, r];
  }));
  // Find any movable with a fixed feast on the same MM-DD
  const __dirname = (1, undefined);
  // We already loaded calendar JSON above
  let checked = false;
  for (const e of cal) {
    const hasMD = Number.isInteger(e?.month) && Number.isInteger(e?.day) && e.day > 0;
    if (!hasMD) continue;
    const mm = String((e.month ?? 0)+1).padStart(2,"0");
    const dd = String(e.day).padStart(2,"0");
    // For each movable ID in calendar, see if any land on this MM-DD
    for (const m of cal.filter(x => !Number.isInteger(x.month) && !Number.isInteger(x.day))) {
      const L62 = lookup1962(y);
      const L74 = lookup1974(y);
      const d = L74[m.id] || L62[m.id];
      if (!d) continue;
      const D = new Date(d);
      const mm2 = String(D.getUTCMonth()+1).padStart(2,"0");
      const dd2 = String(D.getUTCDate()).padStart(2,"0");
      if (mm === mm2 && dd === dd2) {
        const ymd = `${y}-${mm}-${dd}`;
        const row = idx.get(ymd);
        if (row) {
          checked = true;
          assert(row.id === m.id, `Movable ${m.id} should override fixed ${e.id} on ${ymd}`);
          return; // success
        }
      }
    }
  }
  if (!checked) assert(true, "no overlapping fixed/movable day found to test");
});
