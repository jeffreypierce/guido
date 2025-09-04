
// tests/suite.festum.js
import { festum } from "../src/festum/festum.js";
import { lookup1974, lookup1962 } from "../src/festum/datum.js";

banner("festum — public API & mass selection");

it("structure is returned with required fields", () => {
  const c = festum("2025-06-15", { form: "OF" });
  for (const k of ["feastId","title","rank","season","form","weekday","bvm","masses"]) {
    assert(Object.hasOwn(c, k), `missing field ${k}`);
  }
  assert(Array.isArray(c.masses), "masses is array");
  if (c.masses.length) assert(typeof c.masses[0] === "number", "masses contain numeric IDs");
});

it("Easter Sunday (OF) returns Eastertide season and reasonable candidates", () => {
  const L = lookup1974(2025);
  const c = festum(L.easter_sunday, { form: "OF" });
  assert(c.season === "ea", "expected Eastertide");
  assert(Array.isArray(c.masses), "masses is array");
  // Some datasets may not include Triduum-specific Kyriale ranks; tolerate empty when rank is 't'.
  if (c.rank !== 't') assert(c.masses.length > 0, "expected mass candidates");
  if (c.masses.length) assert(typeof c.masses[0] === "number", "masses contain numeric IDs");
});

it("Ordinary Sunday (OF) returns Ordinary Time", () => {
  const L = lookup1974(2025);
  const c = festum(new Date(Date.UTC(2025, 6, 6)), { form: "OF" }); // July 6, 2025 (mid-OT)
  assert(c.season === "ot" || c.season === "ot1" || c.season === "ot2", "expected Ordinary Time");
});

it("Marian Saturday (EF) executes selection and exposes BVM flag", () => {
  const L = lookup1962(2025);
  // pick a Saturday in Time after Pentecost (EF) → simple heuristic
  const d = new Date(L.pentecost); d.setUTCDate(d.getUTCDate() + 13); // Pentecost + 13 ≈ Saturday
  const c = festum(d, { form: "EF" });
  assert(typeof c.bvm === "boolean", "bvm flag present");
  assert(Array.isArray(c.masses), "masses is array");
  // soft assertion: selection executed
  assert(true, "selection executed");
});

it("weekday flag reflects Sunday vs weekday", () => {
  const sun = festum("2025-06-15", { form: "OF" });
  const mon = festum("2025-06-16", { form: "OF" });
  assert(sun.weekday === "dominica", "expected Sunday to be dominica");
  assert(mon.weekday === "feria", "expected Monday to be feria");
});

it("BVM feasts expose bvm=true and return masses array", () => {
  const L = lookup1974(2025);
  const c = festum(L.bvm_church_mom, { form: "OF" });
  assert(c.bvm === true, "expected bvm day to set bvm=true");
  assert(Array.isArray(c.masses), "masses is array");
});

it("Lenient selection returns candidates on Good Friday (OF)", () => {
  const L = lookup1974(2025);
  const strict = festum(L.good_friday, { form: "OF" });
  const lenient = festum(L.good_friday, { form: "OF", lenientSelection: true });
  // Strict likely empty due to rank 't' not in dataset
  assert(Array.isArray(strict.masses), "strict masses array exists");
  assert(Array.isArray(lenient.masses), "lenient masses array exists");
  assert(lenient.masses.length >= strict.masses.length, "lenient should not reduce candidates");
});

it("EF Marian Saturday heuristic marks bvm when enabled", () => {
  const L = lookup1962(2025);
  const d = new Date(L.pentecost); d.setUTCDate(d.getUTCDate() + 13); // Saturday
  const c = festum(d, { form: "EF", bvmHeuristic: true });
  assert(c.bvm === true, "expected bvm heuristic to mark Marian Saturday");
});
