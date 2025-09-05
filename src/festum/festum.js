// src/festum/festum.js
import { toUTC, stableJson, normalizeForm } from "../aux/index.js";
import { calendarium } from "./calendarium.js";
import { seasonNormalize } from "./tempus.js";
import { selectCandidates } from "../cantus/ordinarium/select.js";

/**
 * Identifier of a Kyriale mass (e.g., 1–18).
 * @typedef {number} MassId
 */

/**
 * A full mass entry returned when `verbose` is enabled.
 * @typedef FullMass
 * @property {string} roman
 * @property {number} mass
 * @property {string} title
 * @property {string[]} credos
 * @property {number} tier - 0=strict; higher numbers are more lenient tiers
 * @property {number} rankWeight - Rank weight used in sorting (t=5, s=4, f=3, m=2, o=1)
 * @property {string[]} seasons
 * @property {('t'|'s'|'f'|'m'|'o')[]} ranks
 * @property {('dominica'|'feria')[]} days
 * @property {boolean} bvm
 * @property {string[]} aliases
 * @property {string} notes
 */

/**
 * Result describing the day’s celebration and suggested mass options.
 * @typedef Festum
 * @property {string} feastId - Calendar `id` for the feast or `feria`.
 * @property {string} title - Title from the calendar overlay or "Feria".
 * @property {'t'|'s'|'f'|'m'|'o'} rank - Rank code (form-specific labels in constants).
 * @property {'ad'|'ct'|'lt'|'ea'|'ot'|'ot1'|'ot2'|'ap'|'sg'} season - Season code.
 * @property {'EF'|'OF'} form - Liturgical form used for classification.
 * @property {'dominica'|'feria'} weekday - Sunday vs weekday heuristic for selection.
 * @property {boolean} bvm - True if the day is identified as BVM-related (heuristic).
 * @property {MassId[]} masses - Sorted list of candidate mass IDs.
 * @property {FullMass[]} [massesDetailed] - Present only when `options.verbose` is truthy; includes full selection metadata.
 */

/**
 * Return celebration details for the given date and form.
 * @param {Date|string|number} date - Any Date-like value; coerced to UTC-midnight.
 * @param {{
 *   form?: 'EF'|'OF'|'1962'|'1974',
 *   splitOrdinary?: boolean,
 *   transfer?: { epiphany?: boolean, ascension?: boolean, corpusChristi?: boolean },
 *   bvmHeuristic?: boolean,      // broaden BVM detection (Marian IDs, EF Marian Saturdays)
 *   lenientSelection?: boolean,  // enable relaxed fallback tiers if strict has no matches
 *   verbose?: boolean,           // include `massesDetailed` with full ranking info
 * }} [options]
 * @returns {Festum}
 */
export function festum(date, options = {}) {
  const form = normalizeForm(options.form ?? "EF");
  const day = toUTC(date);
  const year = day.getUTCFullYear();

  // Build or reuse year calendar for the selected form
  const cacheKey = `${year}|${form}|${
    options.splitOrdinary ? 1 : 0
  }|${stableJson(options.transfer || {})}`;
  const _calCache = festum._calCache || (festum._calCache = new Map());
  let cr = _calCache.get(cacheKey);
  if (!cr) {
    cr = calendarium(year, {
      form,
      splitOrdinary: !!options.splitOrdinary,
      transfer: options.transfer || {},
    });
    _calCache.set(cacheKey, cr);
  }

  // Pick the exact (or nearest) row
  const ts = day.getTime();
  let closest = cr.find((row) => row.ts === ts);
  if (!closest) {
    // Fallback to nearest to be resilient to unexpected gaps
    closest = cr.reduce(
      (best, row) =>
        Math.abs(row.ts - ts) < Math.abs(best.ts - ts) ? row : best,
      cr[0]
    );
  }

  const dow = new Date(closest.ts).getUTCDay();
  const weekday = dow === 0 ? "dominica" : "feria";
  const id = String(closest.id || "");
  const baseBvm = /(^|_)bvm(_|$)/i.test(id);
  let bvm = baseBvm;
  if (!bvm && options.bvmHeuristic) {
    const isMarian =
      /bvm|mary|immaculate|annunciation|assumption|rosary|mother_of_god|heart_of_mary/i.test(
        id
      );

    bvm = isMarian || (dow === 6 && seasonNormalize(closest.season) === "ot"); // marian saturday
  }

  const candidates = selectCandidates(
    { ...closest, weekday, bvm },
    {
      lenientSelection: !!options.lenientSelection,
      bvmHeuristic: !!options.bvmHeuristic,
    }
  );

  const toFull = (m) => ({
    roman: m.key,
    mass: m.mass,
    title: m.title,
    credos: m.credos,
    tier: m._tier,
    rankWeight: m._rankWeight,
    seasons: m.seasons,
    ranks: m.ranks,
    days: m.days,
    bvm: m.bvm,
    aliases: m.aliases,
    notes: m.notes,
  });

  const massesIds = candidates.map((c) => c.mass);

  const res = {
    feastId: closest.id,
    title: closest.title,
    rank: closest.rank,
    season: closest.season,
    form,
    weekday,
    bvm,
    masses: massesIds,
  };

  if (options.verbose) res.massesDetailed = candidates.map(toFull);

  return res;
}
