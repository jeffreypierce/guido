// src/festum/index.js
import {
  toUTC,
  stableJson,
  normalizeForm,
  normalizeSeason,
} from "../aux/index.js";
import { calendarium } from "./calendarium.js";
import selectMasses from "./missa.js";

function isMarianFeast(fest) {
  const id = String(fest?.feastId || fest?.id || "");
  const title = String(fest?.title || "");
  const titleLa = String(fest?.title_la || "");
  const hay = (id + " " + title + " " + titleLa).toLowerCase();
  return /\bbvm\b|\bmary\b|maria|immaculate|annunciation|assumption|rosary|mother[_\s]?of[_\s]?god|heart[_\s]?of[_\s]?mary/.test(
    hay
  );
}

/**
 * Result describing the day’s celebration and suggested mass options.
 * @typedef Festum
 * @property {string} feastId - Calendar `id` for the feast or `feria`.
 * @property {string} title - Title from the calendar overlay or "Feria".
 * @property {string} titl_la - Latin title from the calendar overlay or "Feria".
 * @property {'t'|'s'|'f'|'m'|'o'} rank - Rank code (form-specific labels in constants).
 * @property {'ad'|'ct'|'lt'|'ea'|'ot'|'ot1'|'ot2'|'ap'|'sg'} season - Season code.
 * @property {'EF'|'OF'} form - Liturgical form used for classification.
 * @property {'dominica'|'feria'} dow - Day of week;, Sunday vs weekday, used for mass selection.
 * @property {boolean} bvm - True if the day is identified as BVM-related (heuristic).
 * @property {MassId[]} masses - Sorted list of candidate mass IDs.
 * @property {FullMass[]} [massesDetailed] - Present only when `options.verbose` is truthy; includes full selection metadata.
 */

/**
 * @param {Date|string|number} date - Any Date-like value; coerced to UTC-midnight.
 * @param {
 *   form?: 'EF'|'OF'
 *   transfer?: { epiphany?: boolean, ascension?: boolean, corpusChristi?: boolean },
 *   verbose?: boolean,           // include `massesDetailed` with full ranking info
 * } [options]
 * @returns {Festum}
 *
 */

export default function festum(date, options = {}) {
  const form = normalizeForm(options.form ?? "EF");
  const day = toUTC(date);
  const year = day.getUTCFullYear();
  const transfer = stableJson(options.transfer || {});

  // Build or reuse year calendar for the selected form
  const cacheKey = `${year}|${form}|${transfer}`;
  const cal = festum.cal || (festum.cal = new Map());
  let cr = cal.get(cacheKey);
  if (!cr) {
    cr = calendarium(year, {
      form,
      transfer,
    });
    cal.set(cacheKey, cr);
  }

  const ts = day.getTime();
  let closest = cr.find((f) => f.ts === ts);
  // Fallback to nearest, uncomment if not loading "base" days.
  // if (!closest) {
  //   closest = cr.reduce(
  //     (best, fi) => (Math.abs(fi.ts - ts) < Math.abs(best.ts - ts) ? fi : best),
  //     cr[0]
  //   );
  // }

  const weekday = new Date(closest.ts).getUTCDay();
  const dow = weekday === 0 ? "dominica" : "feria";
  const bvm = closest.bvm
    ? closest.bvm
    : isMarianFeast({ ...closest }) ||
      (weekday === 6 && normalizeSeason(closest.season) === "ot"); // marian saturday

  const candidates = selectMasses({ ...closest, dow, bvm });

  const toFull = (m) => ({
    roman: m.key,
    mass: m.mass,
    title: m.title,
    credos: m.credos,
    tier: m.tier,
    rankWeight: m.rankWeight,
    seasons: m.seasons,
    ranks: m.ranks,
    days: m.days,
    bvm: m.bvm,
    aliases: m.aliases,
    notes: m.notes,
  });

  const res = {
    feastId: closest.id,
    title: closest.title,
    title_la: closest.title_la,
    rank: closest.rank,
    season: closest.season,
    form,
    dow,
    bvm,
    masses: candidates.map((c) => c.mass),
  };

  if (options.verbose) res.massesDetailed = candidates.map(toFull);

  return res;
}
