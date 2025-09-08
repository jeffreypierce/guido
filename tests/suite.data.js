// tests/suite.data.js
banner("data — integrity checks");

import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const ALLOWED_SEASONS = new Set([
  "ad",
  "ct",
  "lt",
  "ea",
  "ot",
  "ot1",
  "ot2",
  "ap",
  "sg",
  "ot2",
]);
const ALLOWED_RANKS = new Set(["t", "s", "f", "m", "o"]);
const ALLOWED_DAYS = new Set(["dominica", "feria"]);

// Use the primary masses dataset (JS module in this repo)
import massesData from "../src/festum/data/masses.js";

it("masses entries have normalized codes", () => {
  const all = [];
  if (massesData.masses) {
    for (const [k, v] of Object.entries(massesData.masses))
      all.push({ k, ...v });
  }
  if (Array.isArray(massesData.adlib)) {
    for (const v of massesData.adlib)
      all.push({ k: v.title || "(adlib)", ...v });
  }
  for (const m of all) {
    for (const s of m.seasons || [])
      assert(ALLOWED_SEASONS.has(s), `bad season ${s} in ${m.title || m.k}`);
    for (const r of m.ranks || [])
      assert(ALLOWED_RANKS.has(r), `bad rank ${r} in ${m.title || m.k}`);
    for (const d of m.days || [])
      assert(ALLOWED_DAYS.has(d), `bad day ${d} in ${m.title || m.k}`);
  }
});

// Calendar IDs present (import JS module instead of JSON file)
import calendar from "../src/festum/data/calendar.js";
import { lookupEF, lookupOF } from "../src/festum/datum.js";

function ids(arr) {
  return new Set(arr.filter(Boolean).map((e) => e.id));
}

it("calendar movable IDs are resolvable by lookups", () => {
  const year = 2025;
  const movableIds = Array.from(ids(calendar))
    .filter((id) => id && !/^\s*$/.test(id))
    .filter((id) => {
      const e = calendar.find((x) => x.id === id);
      return !(Number.isInteger(e.month) && Number.isInteger(e.day)); // not fixed
    });
  const L62 = lookupEF(year);
  const L74 = lookupOF(year);
  for (const id of movableIds) {
    assert(L62[id] || L74[id], `movable id not provided by lookups: ${id}`);
  }
});

it("masses.json has unique numeric mass numbers", async () => {
  const seen = new Set();
  let count = 0;
  if (massesData.masses) {
    for (const [k, v] of Object.entries(massesData.masses)) {
      if (typeof v.mass === "number" && Number.isFinite(v.mass)) {
        count++;
        assert(!seen.has(v.mass), `duplicate mass number ${v.mass} (${k})`);
        seen.add(v.mass);
      }
    }
  }
  assert(count > 0, "no numeric mass entries found");
});
