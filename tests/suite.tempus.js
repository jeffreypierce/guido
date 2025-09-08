// tests/suite.tempus.js
import { normalizeSeason } from "../src/aux/index.js";
import { lookupEF, lookupOF } from "../src/festum/datum.js";
import { seasonEF, seasonOF } from "../src/festum/tempus.js";

banner("tempus — season classifiers");

function addDays(d, n) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

it("EF: returns one of the EF codes at key boundaries", () => {
  for (const y of [2024, 2025]) {
    const L = lookupEF(y);
    const codes = new Set(["ad", "ct", "ot2", "sg", "lt", "ea", "ap"]);
    assert(codes.has(seasonEF(L.advent_sunday, L)), "EF Advent");
    assert(codes.has(seasonEF(L.christmas, L)), "EF Christmas");
    assert(codes.has(seasonEF(L.ash_wednesday, L)), "EF Lent");
    assert(codes.has(seasonEF(L.easter_sunday, L)), "EF Easter");
    assert(
      codes.has(seasonEF(addDays(L.pentecost, 1), L)),
      "EF after Pentecost"
    );
  }
});

it("OF: returns one of the OF codes at key boundaries", () => {
  for (const y of [2024, 2025]) {
    const L = lookupOF(y);
    const codes = new Set(["ad", "ct", "lt", "ea", "ot", "ot1", "ot2"]);
    assert(codes.has(seasonOF(L.advent_sunday, L)), "OF Advent");
    assert(codes.has(seasonOF(L.christmas, L)), "OF Christmas");
    assert(codes.has(seasonOF(L.ash_wednesday, L)), "OF Lent");
    assert(codes.has(seasonOF(L.easter_sunday, L)), "OF Easter");
    assert(codes.has(seasonOF(addDays(L.pentecost, 1), L)), "OF Ordinary");
  }
});

it("normalizeSeason glues EF/OF codes for mass-selection", () => {
  assert(normalizeSeason("ap") === "ot", "ap→ot");
  assert(normalizeSeason("ot2") === "ot", "ot2→ot");
  assert(
    normalizeSeason("sg") === "lt" || normalizeSeason("sg") === "ot",
    "sg maps to a generic bucket"
  );
});

it("yields ot1 before Lent and ot2 after Pentecost", () => {
  for (const y of [2024, 2025]) {
    const L = lookupOF(y);
    // A day between Baptism and Ash Wednesday
    const midOT1 = new Date(L.baptism);
    midOT1.setUTCDate(midOT1.getUTCDate() + 7);
    const a = seasonOF(midOT1, L);
    assert(a === "ot1", `expected ot1 before Lent (${y})`);
    // A day well after Pentecost
    const midOT2 = new Date(L.pentecost);
    midOT2.setUTCDate(midOT2.getUTCDate() + 14);
    const b = seasonOF(midOT2, L);
    assert(b === "ot2", `expected ot2 after Pentecost (${y})`);
  }
});
