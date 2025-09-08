// tests/suite.tempus.js
import { lookup1962, lookup1974 } from "../src/festum/datum.js";
import {
  season1962,
  season1974,
  seasonNormalize,
} from "../src/festum/tempus.js";

banner("tempus — season classifiers");

function addDays(d, n) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

it("EF: returns one of the EF codes at key boundaries", () => {
  for (const y of [2024, 2025]) {
    const L = lookup1962(y);
    const codes = new Set(["ad", "ct", "ot2", "sg", "lt", "ea", "ap"]);
    assert(codes.has(season1962(L.advent_sunday, L)), "EF Advent");
    assert(codes.has(season1962(L.christmas, L)), "EF Christmas");
    assert(codes.has(season1962(L.ash_wednesday, L)), "EF Lent");
    assert(codes.has(season1962(L.easter_sunday, L)), "EF Easter");
    assert(
      codes.has(season1962(addDays(L.pentecost, 1), L)),
      "EF after Pentecost"
    );
  }
});

it("1974: returns one of the OF codes at key boundaries", () => {
  for (const y of [2024, 2025]) {
    const L = lookup1974(y);
    const codes = new Set(["ad", "ct", "lt", "ea", "ot", "ot1", "ot2"]);
    assert(codes.has(season1974(L.advent_sunday, L)), "OF Advent");
    assert(codes.has(season1974(L.christmas, L)), "OF Christmas");
    assert(codes.has(season1974(L.ash_wednesday, L)), "OF Lent");
    assert(codes.has(season1974(L.easter_sunday, L)), "OF Easter");
    assert(codes.has(season1974(addDays(L.pentecost, 1), L)), "OF Ordinary");
  }
});

it("seasonNormalize glues EF/OF codes for mass-selection", () => {
  assert(seasonNormalize("ap") === "ot", "ap→ot");
  assert(seasonNormalize("ot2") === "ot", "ot2→ot");
  assert(
    seasonNormalize("sg") === "lt" || seasonNormalize("sg") === "ot",
    "sg maps to a generic bucket"
  );
});

it("splitOrdinary yields ot1 before Lent and ot2 after Pentecost", () => {
  for (const y of [2024, 2025]) {
    const L = lookup1974(y);
    // A day between Baptism and Ash Wednesday
    const midOT1 = new Date(L.baptism);
    midOT1.setUTCDate(midOT1.getUTCDate() + 7);
    const a = season1974(midOT1, L, { splitOrdinary: true });
    assert(a === "ot1", `expected ot1 before Lent (${y})`);
    // A day well after Pentecost
    const midOT2 = new Date(L.pentecost);
    midOT2.setUTCDate(midOT2.getUTCDate() + 14);
    const b = season1974(midOT2, L, { splitOrdinary: true });
    assert(b === "ot2", `expected ot2 after Pentecost (${y})`);
  }
});
