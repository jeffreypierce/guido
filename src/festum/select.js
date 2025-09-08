// Shared Kyriale mass candidate selection (moved from former kyriale/select.js)
import MASSES from "./data/masses.js";
import { seasonNormalize } from "../aux/index.js";

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

export function selectCandidates(festum, opts = {}) {
  const rows = buildMassRows();
  const exact = festum.season;
  const generic = seasonNormalize(exact);
  const weekday = festum.weekday;
  let bvmFlag = !!festum.bvm;

  const tiers = [];
  tiers.push(
    rows.filter(
      (m) =>
        (m.seasons.includes(exact) || m.seasons.includes(generic)) &&
        m.ranks.includes(festum.rank) &&
        m.days.includes(weekday) &&
        (!bvmFlag || m.bvm === true)
    )
  );
  if (bvmFlag && tiers[0].length === 0) {
    tiers.push(
      rows.filter(
        (m) =>
          (m.seasons.includes(exact) || m.seasons.includes(generic)) &&
          m.ranks.includes(festum.rank) &&
          m.days.includes(weekday)
      )
    );
  }
  // more lenient selection if neede
  tiers.push(
    rows.filter(
      (m) =>
        (m.seasons.includes(exact) || m.seasons.includes(generic)) &&
        m.days.includes(weekday)
    )
  );
  tiers.push(
    rows.filter((m) => m.seasons.includes(exact) || m.seasons.includes(generic))
  );
  tiers.push(rows.slice());

  const seen = new Set();
  const collected = [];
  tiers.forEach((arr, i) => {
    for (const m of arr) {
      if (seen.has(m.key)) continue;
      seen.add(m.key);
      const rw = Math.max(0, ...m.ranks.map((r) => RANK_WEIGHT[r] || 0));
      collected.push({ ...m, _tier: i, _rankWeight: rw });
    }
  });

  collected.sort(
    (a, b) =>
      a._tier - b._tier ||
      b._rankWeight - a._rankWeight ||
      a.mass - b.mass ||
      a.key.localeCompare(b.key)
  );
  return collected;
}

export default selectCandidates;
