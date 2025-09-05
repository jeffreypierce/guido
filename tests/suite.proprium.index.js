// tests/suite.proprium.index.js — verify proprium index precedence and potIndex fallback
import { festum } from "../src/festum/festum.js";
import proprium from "../src/cantus/proprium/index.js";
import DAY from "../src/cantus/data/day.index.js";
import { lookup1962 } from "../src/festum/datum.js";

banner("proprium — index + potIndex integration");

it("uses dayIndex propers when available", () => {
  // find a day in dayIndex with propers set
  const EF = DAY.EF || {};
  let mmdd = null;
  for (const k of Object.keys(EF)) {
    const v = EF[k];
    const arr = Array.isArray(v) ? v : [v];
    if (arr.some((r) => r.propers && Object.keys(r.propers).length)) { mmdd = k; break; }
  }
  if (!mmdd) throw new Error("no dayIndex entries with propers");
  const [m, dd] = mmdd.split('-').map((s) => Number(s));
  const date = new Date(Date.UTC(2025, m - 1, dd));
  const F = festum(date, { form: 'EF' });
  const items = proprium({ festum: F }, { useIndex: true });
  assert(Array.isArray(items) && items.length > 0, "no items returned");
  // at least Introit present with some candidates
  const inItem = items.find((x) => x.office === 'in');
  assert(inItem && Array.isArray(inItem.candidates) && inItem.candidates.length > 0, "no Introit candidates from index");
});

it("potIndex fallback produces candidates for a landmark (Epiphany)", () => {
  const L = lookup1962(2025);
  const dt = L.epiphany; // fixed EF landmark
  const F = festum(new Date(dt), { form: 'EF' });
  const items = proprium({ festum: F }, { useIndex: true });
  assert(Array.isArray(items) && items.length > 0, "no items returned");
  const inItem = items.find((x) => x.office === 'in');
  assert(inItem && inItem.candidates && inItem.candidates.length > 0, "no Introit candidates from potIndex");
});
