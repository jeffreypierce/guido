// src/festum/calendarium.js
import cal from "./data/calendar.json" assert { type: "json" };
import { lankmarks1962, lankmarks1974 } from "./datum.js";
import { season1962, season1974 } from "./tempus.js";

const DAY = 86400000;
const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
const mmdd = (d) => `${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
const ymd = (d) =>
  `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;

/** Build EF/OF daily calendar array for a year */
export function calendarium(
  year,
  { form = "1962", splitOrdinary = false, transfer = {} } = {}
) {
  // Landmarks (EF or OF)
  const L =
    form === "1974" ? lankmarks1974(year, { transfer }) : lankmarks1962(year);

  // Fixed index (your fixed entries use 0-based month in JSON)
  const fixedByMMDD = new Map();
  for (const e of cal.fixed ?? []) {
    fixedByMMDD.set(`${pad2((e.month ?? 0) + 1)}-${pad2(e.day)}`, e);
  }

  // Movable index per lookup ID → date

  const movableByYMD = new Map();
  for (const e of cal.movable ?? []) {
    if (d) movableByYMD.set(ymd(toUTC(d)), e);
  }

  // Walk each day
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));

  const days = [];

  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + DAY)) {
    // Season code (EF/OF aware)
    const season =
      form === "1974" ? season1974(d, L, { splitOrdinary }) : season1962(d, L);
    const base = {
      ts: d.getTime(),
      id: "feria",
      title: "Feria",
      rank: "o",
      season,
      type: "feria",
    };
    const e = movableByYMD.get(ymd(d)) || fixedByMMDD.get(mmdd(d));
    days.push(
      e
        ? {
            ...base,
            id: e.id,
            title: e.title,
            title_la: e.title_la,
            rank: e.rank,
            type: e.type,
          }
        : base
    );
  }

  return days;
}
