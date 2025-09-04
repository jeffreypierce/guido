// src/festum/festum.js
import { toUTC } from "../aux/aux.js";
import { calendarium } from "./calendarium.js";
import MASSES from "./data/masses.json" assert { type: "json" };
import { seasonNormalize } from "./tempus.js";

/**
 * Build and filter Kyriale mass candidates for the given day context.
 * @param {{ season: string, rank: 't'|'s'|'f'|'m'|'o' }} row
 * @param {'dominica'|'feria'} weekday
 * @param {boolean} bvmFlag
 * @returns {{ best: { key: string, mass: number } | null, candidates: Array<{ key: string, mass: number, title: string, seasons: string[], ranks: string[], days: string[], bvm: boolean, credos: string[], aliases: string[], notes: string }> }}
 */
function selectMasses(row, weekday, bvmFlag) {
  const Masses = Object.entries(MASSES.masses || {}).map(([key, v]) => ({
    key,
    mass: Number(v.mass),
    title: v.title,
    seasons: v.seasons || [],
    ranks: v.ranks || [],
    days: v.days || [],
    bvm: !!v.bvm,
    credos: v.credos || [],
    aliases: v.aliases || [],
    notes: v.notes || "",
  }));

  const exact = row.season;
  const generic = seasonNormalize(exact);

  let candidates = Masses.filter(
    (m) =>
      (m.seasons.includes(exact) || m.seasons.includes(generic)) &&
      m.ranks.includes(row.rank) &&
      m.days.includes(weekday) &&
      (!bvmFlag || m.bvm === true)
  );

  if (bvmFlag && candidates.length === 0) {
    candidates = Masses.filter(
      (m) =>
        (m.seasons.includes(exact) || m.seasons.includes(generic)) &&
        m.ranks.includes(row.rank) &&
        m.days.includes(weekday)
    );
  }

  candidates.sort((a, b) => a.mass - b.mass || a.key.localeCompare(b.key));
  const best = candidates[0] || null;
  return { best, candidates };
}

/**
 * Identifier of a Kyriale mass (e.g., 1–18).
 * @typedef {number} MassId
 */

/**
 * Result describing the day’s celebration and suggested mass options.
 * @typedef Festum
 * @property {string} feastId - Calendar `id` for the feast or `feria`.
 * @property {string} title - Title from the calendar overlay or "Feria".
 * @property {'t'|'s'|'f'|'m'|'o'} rank - Rank code (form-specific labels in constants).
 * @property {'ad'|'ct'|'lt'|'ea'|'ot'|'ot1'|'ot2'|'ap'|'sg'} season - Season code.
 * @property {'1962'|'1974'} form - Liturgical form used for classification.
 * @property {'dominica'|'feria'} weekday - Sunday vs weekday heuristic for selection.
 * @property {boolean} bvm - True if the day is identified as BVM-related (heuristic).
 * @property {MassId[]} masses - Sorted list of candidate mass IDs.
 */

/**
 * Return celebration details for the given date and form.
 * @param {Date|string|number} date - Any Date-like value; coerced to UTC-midnight.
 * @param {{ form?: '1962'|'1974', splitOrdinary?: boolean, transfer?: { epiphany?: boolean, ascension?: boolean, corpusChristi?: boolean } }} [options]
 * @returns {Festum}
 */
export function festum(date, options = {}) {
  const form = options.form ?? "1962";
  const day = toUTC(date);
  const year = day.getUTCFullYear();

  // Build year calendar for the selected form
  const cr = calendarium(year, {
    form,
    splitOrdinary: !!options.splitOrdinary,
    transfer: options.transfer || {},
  });

  // Pick the exact (or nearest) row
  const ts = day.getTime();
  const closest = cr.reduce(
    (best, row) =>
      Math.abs(row.ts - ts) < Math.abs(best.ts - ts) ? row : best,
    cr[0]
  );

  const weekday = new Date(closest.ts).getUTCDay() === 0 ? "dominica" : "feria";
  const bvm = /(^|_)bvm(_|$)/i.test(closest.id);

  const { candidates } = selectMasses(closest, weekday, bvm);

  return {
    feastId: closest.id,
    title: closest.title,
    rank: closest.rank, // code
    season: closest.season, // code
    form,
    weekday,
    bvm,
    masses: candidates.map((c) => c.mass),
  };
}
