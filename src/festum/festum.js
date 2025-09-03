// src/festum/index.js

// If you already placed calendarium_romanum elsewhere, adjust this import.
import { datum } from "./datum.js";
import { normalizeSeason } from "./tempus.js";
import MASSES from "./data/masses.json" assert { type: "json" };

function normalizeMasses(obj) {
  return Object.entries(obj).map(([key, v]) => ({
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
}
const Masses = normalizeMasses(MASSES);

function selectMasses(row, weekday, bvmFlag, form) {
  const seasonForMass = normalizeSeason(row.season);
  let candidates = Masses.filter(
    (m) =>
      (m.seasons.includes(row.season) || m.seasons.includes(seasonForMass)) &&
      m.ranks.includes(row.rank) &&
      m.days.includes(weekday) &&
      (!bvmFlag || m.bvm === true)
  );

  if (bvmFlag && candidates.length === 0) {
    candidates = MASSES.filter(
      (m) =>
        (m.seasons.includes(row.season) || m.seasons.includes(seasonForMass)) &&
        m.ranks.includes(row.rank) &&
        m.days.includes(weekday)
    );
  }

  candidates.sort((a, b) => a.mass - b.mass || a.key.localeCompare(b.key));
  const best = candidates[0] || null;
  return { best, candidates };
}

/**
 * Return celebration details for the given date.
 * Deterministic, UTC-safe, form-aware (1962/1974).
 * @param {Date|string|number} date
 * @param {{ form?: "1962"|"1974" }} [options]
 * @returns {Feast}
 */
export function festum(date, options = {}) {
  const form = options.form ?? "1962";
  const day = toUTC(date);
  const year = day.getUTCFullYear();

  // 1) Lookups (shared Easter core + EF/OF differences)
  const landmarks =
    form === "1974" ? lookup1974(year, { transfer }) : lookup1962(year);

  // 2) Season code (EF/OF aware)
  const season =
    form === "1974"
      ? season1974(day, landmarks, { splitOrdinary })
      : season1962(day, landmarks);

  const weekday = new Date(row.ts).getUTCDay() === 0 ? "dominica" : "feria";
  const bvm = /(^|_)bvm(_|$)/i.test(row.id);

  // TODO, build calendar here

  // Find the row for this day (or the nearest day if you prefer that behavior)
  const ts = day.getTime();
  const closest = cr.reduce(
    (best, row) =>
      Math.abs(row.ts - ts) < Math.abs(best.ts - ts) ? row : best,
    cr[0]
  );
  const { best, candidates } = selectMasses(row, weekday, bvm, form);

  // Map the calendar row to the Feast shape
  return {
    feastId: closest.id,
    title: closest.title,
    rank: closest.rank, // short code e.g. 's'
    season, // code per form
    form,
    weekday,
    bvm,
    ordinary: best
      ? { key: best.key, mass: best.mass, title: best.title }
      : null,
    ordinary_all: candidates.map((c) => ({
      key: c.key,
      mass: c.mass,
      title: c.title,
    })),
  };
}

/* ───────────────────────── helpers ───────────────────────── */
