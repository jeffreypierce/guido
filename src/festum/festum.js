// src/festum/festum.js  (or index.js if you prefer)
import { toUTC } from "../aux/aux.js";
import { calendarium } from "./calendarium.js";
import MASSES from "./data/masses.json" assert { type: "json" };
import { seasonNormalize } from "./tempus.js";

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
    candidates = MASSES.filter(
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
 * Return celebration details for the given date & form.
 * @param {Date|string|number} date
 * @param {{ form?: "1962"|"1974", splitOrdinary?: boolean }} [options]
 */
export function festum(date, options = {}) {
  const form = options.form ?? "1962";
  const day = toUTC(date);
  const year = day.getUTCFullYear();

  // Build year calendar for the selected form
  const cr = calendarium(year, {
    form,
    splitOrdinary: !!options.splitOrdinary,
    transfer: !!options.transfer,
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

  const candidates = selectMasses(closest, weekday, bvm);

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
