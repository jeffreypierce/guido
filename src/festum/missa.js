// Shared Kyriale mass candidate selection (moved from former kyriale/select.js)
import MASSES from "./data/masses.js";
import { normalizeSeason } from "../aux/index.js";

const RANK_WEIGHT = { t: 5, s: 4, f: 3, m: 2, o: 1 };

function buildMassRows() {
  return Object.entries(MASSES.masses || {}).map(([key, v]) => ({
    key,
    mass: Number(v.mass),
    title: v.title,
    seasons: v.seasons || [],
    ranks: v.ranks || [],
    days: v.days || [],
    bvm: !!v.bvm,
    credos: Array.isArray(v.credos) ? v.credos.map(String) : [],
    aliases: v.aliases || [],
    notes: v.notes || "",
  }));
}
/*
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
export default function selectMasses(festum) {
  const rows = buildMassRows();
  const exact = festum.season;
  const generic = normalizeSeason(exact);
  const dow = festum.dow;
  let bvmFlag = !!festum.bvm;

  const tiers = [];
  tiers.push(
    rows.filter(
      (m) =>
        (m.seasons.includes(exact) || m.seasons.includes(generic)) &&
        m.ranks.includes(festum.rank) &&
        m.days.includes(dow) &&
        (!bvmFlag || m.bvm === true)
    )
  );
  if (bvmFlag && tiers[0].length === 0) {
    tiers.push(
      rows.filter(
        (m) =>
          (m.seasons.includes(exact) || m.seasons.includes(generic)) &&
          m.ranks.includes(festum.rank) &&
          m.days.includes(dow)
      )
    );
  }
  // more lenient selection if neede

  if (tiers.length < 1) {
    tiers.push(
      rows.filter(
        (m) =>
          (m.seasons.includes(exact) || m.seasons.includes(generic)) &&
          m.days.includes(dow)
      )
    );
    tiers.push(
      rows.filter(
        (m) => m.seasons.includes(exact) || m.seasons.includes(generic)
      )
    );
    tiers.push(rows.slice());
  }

  const seen = new Set();
  const collected = [];
  tiers.forEach((arr, i) => {
    for (const m of arr) {
      if (seen.has(m.key)) continue;
      seen.add(m.key);
      const rw = Math.max(0, ...m.ranks.map((r) => RANK_WEIGHT[r] || 0));
      collected.push({ ...m, tier: i, rankWeight: rw });
    }
  });

  collected.sort(
    (a, b) =>
      a.tier - b.tier ||
      b.rankWeight - a.rankWeight ||
      a.mass - b.mass ||
      a.key.localeCompare(b.key)
  );
  return collected;
}
