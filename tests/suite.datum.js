// tests/suite.datum.js
import { pascha, lookup1962, lookup1974 } from "../src/festum/datum.js";

banner("datum — lookups & transfers");

function addDays(d, n) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}
function sameDay(a, b) {
  const A = new Date(a),
    B = new Date(b);
  return (
    A.getUTCFullYear() === B.getUTCFullYear() &&
    A.getUTCMonth() === B.getUTCMonth() &&
    A.getUTCDate() === B.getUTCDate()
  );
}

it("Easter core relations hold for multiple years (EF)", () => {
  for (const y of [2024, 2025, 2030, 2038]) {
    const L = lookup1962(y);
    // Pentecost = Easter + 49
    assert(
      sameDay(L.pentecost, addDays(L.easter_sunday, 49)),
      "Pentecost relation failed " + y
    );
    // Trinity = Pentecost + 7
    assert(
      sameDay(L.holy_trinity, addDays(L.pentecost, 7)),
      "Trinity relation failed " + y
    );
    // Ash Wednesday = Easter - 46
    assert(
      sameDay(L.ash_wednesday, addDays(L.easter_sunday, -46)),
      "Ash Wed relation failed " + y
    );
  }
});

it("Transfers (1974): Ascension/Corpus/Epiphany toggle works", () => {
  const y = 2025;
  const L0 = lookup1974(y, {
    transfer: { epiphany: false, ascension: false, corpusChristi: false },
  });
  const L1 = lookup1974(y, {
    transfer: { epiphany: true, ascension: true, corpusChristi: true },
  });
  // Ascension: Thursday vs Sunday (3-day shift)
  const d0 = new Date(L0.ascension).getUTCDay();
  const d1 = new Date(L1.ascension).getUTCDay();
  assert(d0 === 4, "Ascension not Thursday without transfer");
  assert(d1 === 0, "Ascension not Sunday with transfer");
  // Corpus Christi: Thursday vs Sunday
  assert(
    new Date(L0.corpus_christi).getUTCDay() === 4,
    "Corpus not Thu without transfer"
  );
  assert(
    new Date(L1.corpus_christi).getUTCDay() === 0,
    "Corpus not Sun with transfer"
  );
  // Epiphany: Jan 6 vs Sunday between Jan 2–8
  assert(
    new Date(L0.epiphany).getUTCMonth() === 0 &&
      new Date(L0.epiphany).getUTCDate() === 6,
    "Epiphany not Jan 6 without transfer"
  );
  assert(
    new Date(L1.epiphany).getUTCDay() === 0,
    "Epiphany not Sunday with transfer"
  );
});

it("Holy Family (OF): Sunday within Dec 26–31 or Dec 30 fallback", () => {
  const y = 2025;
  const L = lookup1974(y);
  const hf = new Date(L.holy_family);
  const mm = hf.getUTCMonth();
  const dd = hf.getUTCDate();
  const sun = hf.getUTCDay() === 0;
  const withinOctave = mm === 11 && dd >= 26 && dd <= 31;
  const fallback = mm === 11 && dd === 30;
  assert((withinOctave && sun) || fallback, "Holy Family rule violated");
});

it("Mother of the Church and Immaculate Heart derived from Pentecost/ Sacred Heart", () => {
  const y = 2025;
  const L = lookup1974(y);
  // Mother of the Church = Pentecost + 1 day
  const mom = new Date(L.bvm_church_mom);
  const p1 = new Date(L.pentecost);
  p1.setUTCDate(p1.getUTCDate() + 1);
  expectSameDay(mom, p1, "BVM Mother of the Church not Pentecost+1");
  // Immaculate Heart = Sacred Heart + 1 day
  const ihm = new Date(L.bvm_immaculate_heart);
  const sh1 = new Date(L.sacred_heart);
  sh1.setUTCDate(sh1.getUTCDate() + 1);
  expectSameDay(ihm, sh1, "Immaculate Heart not Sacred Heart+1");
});
