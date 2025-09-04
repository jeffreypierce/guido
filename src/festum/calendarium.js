// src/festum/calendarium.js
import { toUTC } from "../aux/aux.js";
import calendar from "./data/calendar.json" assert { type: "json" };
import { lookup1962, lookup1974 } from "./datum.js";
import { season1962, season1974 } from "./tempus.js";

const DAY = 86400000;
const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
const mmdd = (d) => `${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
const ymd = (d) =>
  `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;

/**
 * One day of the computed calendar with overlay data if any.
 * @typedef CalendarRow
 * @property {number} ts - UTC timestamp (00:00) for the day.
 * @property {string} id - Calendar `id` for the feast or `feria`.
 * @property {string} title - Feast title or "Feria".
 * @property {'t'|'s'|'f'|'m'|'o'} rank - Rank code.
 * @property {'ad'|'ct'|'lt'|'ea'|'ot'|'ot1'|'ot2'|'ap'|'sg'} season - Season code.
 * @property {'fixed'|'movable'|'feria'} type - Entry source.
 */

/**
 * Build the calendar for a given year and form.
 * @param {number} year - Gregorian year in UTC.
 * @param {{ form?: '1962'|'1974', splitOrdinary?: boolean, transfer?: { epiphany?: boolean, ascension?: boolean, corpusChristi?: boolean } }} [opts]
 * @returns {CalendarRow[]} Array of day rows from Jan 1 to Dec 31.
 */
export function calendarium(
  year,
  { form = "1962", splitOrdinary = false, transfer = {} } = {}
) {
  const L = form === "1974" ? lookup1974(year, { transfer }) : lookup1962(year);

  const fixedByMMDD = new Map();
  const movableByYMD = new Map();

  for (const e of calendar) {
    const hasMD =
      Number.isInteger(e?.month) && Number.isInteger(e?.day) && e.day > 0;
    const isFixed = e?.type === "fixed" || (e?.type == null && hasMD);
    const isMovable = e?.type === "movable" || (e?.type == null && !hasMD);

    if (isFixed) {
      // JSON uses 0-based month; ensure valid day
      const key = `${pad2((e.month ?? 0) + 1)}-${pad2(e.day)}`;
      fixedByMMDD.set(key, e);
      continue;
    }

    if (isMovable) {
      // No month/day: match by ID directly to lookup
      const d = L[e.id]; // e.g., "holy_trinity" → Date
      if (!d) continue; // unknown movable; skip safely
      movableByYMD.set(ymd(toUTC(d)), e);
      continue;
    }

    // If neither fixed nor movable, ignore (or log for debug)
  }
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  const days = [];
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + DAY)) {
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
    const fx = fixedByMMDD.get(mmdd(d));
    const mv = movableByYMD.get(ymd(d));
    days.push(fx || mv ? { ...base, ...fx, ...mv } : base);
  }
  return days;
}
