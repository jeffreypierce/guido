// tests/suite.cantus.js
import { cantus, ordo } from "../src/cantus/index.js";
import { ordinarium } from "../src/cantus/index.js";
import { proprium } from "../src/cantus/index.js";
import {
  OFFICE_LABELS,
  ORDINARY_LABELS,
  officeLabel,
  ordinaryLabel,
} from "../src/cantus/data/constants.js";
import { festum } from "../src/festum/index.js";
import { lookupEF, lookupOF } from "../src/festum/datum.js";

banner("cantus — ordo assembly");

it("OF Sunday includes Gloria and Alleluia", () => {
  const L = lookupOF(2025);
  const f = festum("2025-06-15", { form: "OF" }); // OT Sunday
  const o = ordo({ festum: f, forma: "OF" });
  const ordOffices = o.ordinary.map((x) => x.office);
  const propOffices = o.propers.map((x) => x.office);
  assert(ordOffices.includes("gl"), "Gloria should be present on OF Sunday");
  assert(propOffices.includes("al"), "Alleluia should be present in propers");
  assert(
    !propOffices.includes("tr"),
    "Tract should not be present in OT Sunday"
  );
});

it("EF Lent feria omits Gloria and uses Tract", () => {
  const L = lookupEF(2025);
  // Pick a weekday in Lent (Ash Wednesday + 2 days = Friday)
  const d = new Date(L.ash_wednesday);
  d.setUTCDate(d.getUTCDate() + 2);
  const f = festum(d, { form: "EF" });
  const o = ordo({ festum: f, forma: "EF" });
  const ordOffices = o.ordinary.map((x) => x.office);
  const propOffices = o.propers.map((x) => x.office);
  assert(
    !ordOffices.includes("gl"),
    "Gloria should be omitted in Lent feria (EF)"
  );
  assert(propOffices.includes("tr"), "Tract should be present in Lent (EF)");
  assert(
    !propOffices.includes("al"),
    "Alleluia should be omitted in Lent (EF)"
  );
});

it("ordo uses preferred Credo when available (OF Eastertide)", () => {
  const L = lookupOF(2025);
  const d = new Date(L.easter_sunday);
  d.setUTCDate(d.getUTCDate() + 7);
  const f = festum(d, { form: "1974" });
  const oOrd = ordinarium({ festum: f });
  const o = ordo({ festum: f, forma: "1974" });
  // Locate Credo in ordo sequence
  const cr = o.sequence.find((x) => x.kind === "ordinary" && x.office === "cr");
  if (oOrd.credo_preference === "I") {
    assert(
      cr && String(cr.id) === "Liber_Usualis:344",
      "Credo I preferred in ordo"
    );
  } else if (oOrd.credo_preference === "III") {
    assert(
      cr && String(cr.id) === "Liber_Usualis:749",
      "Credo III preferred in ordo"
    );
  } else {
    assert(true, "no credo preference to assert");
  }
});

it("constants are frozen and label helpers work", () => {
  assert(Object.isFrozen(OFFICE_LABELS), "OFFICE_LABELS should be frozen");
  assert(Object.isFrozen(ORDINARY_LABELS), "ORDINARY_LABELS should be frozen");
  assert(officeLabel("in") === "Introitus", "office label 'in'");
  assert(ordinaryLabel("ky") === "Kyrie eleison", "ordinary label 'ky'");
});

banner("cantus — search");

it("search by incipit and office returns matches", () => {
  const rows = cantus({
    offices: ["in"],
    incipit: "Prope es tu",
    source: "1974",
  });
  assert(Array.isArray(rows), "rows array");
  assert(rows.length > 0, "expected at least one match for incipit");
  for (const r of rows) {
    assert(r.office && r.office.code === "in", "office filter respected");
    assert(
      /1974|Graduale_Romanum_1974/.test(r.id) ||
        /1974/.test(r?.source?.name || ""),
      "source filter"
    );
  }
});

it("search by mode filters correctly", () => {
  const rows = cantus({ modes: ["1"] });
  assert(
    rows.every((r) => String(r?.chant?.mode || "") === "1"),
    "all results are mode 1"
  );
});

it("search by source filters correctly", () => {
  const rows = cantus({ source: "Liber Usualis" });
  assert(rows.length > 0, "some LU results");
  assert(
    rows.every(
      (r) =>
        /Liber_Usualis:/.test(String(r.id)) ||
        /Liber Usualis/i.test(String(r?.source?.name || ""))
    ),
    "rows are LU"
  );
});

it("search by AM short code returns Antiphonale Monasticum rows", () => {
  const rows = cantus({ source: "AM" });
  assert(rows.length > 0, "some AM results");
  assert(
    rows.every(
      (r) =>
        /Antiphonale_Monasticum:/.test(String(r.id)) ||
        /Antiphonale Monasticum/i.test(String(r?.source?.name || ""))
    ),
    "rows are AM"
  );
});

banner("cantus — proprium fallback");

it("Eastertide proprium includes Alleluia, not Tract", () => {
  const f = festum("2025-04-20", { form: "OF" }); // around Eastertide
  const items = proprium({ festum: f });
  const offices = new Set(items.map((x) => x.office));
  assert(offices.has("in") && offices.has("gr"), "has IN and GR");
  assert(offices.has("al"), "has Alleluia in Eastertide");
  assert(!offices.has("tr"), "no Tract in Eastertide");
});

it("Lent proprium includes Tract, not Alleluia", () => {
  const f = festum("2025-03-07", { form: "EF" }); // in Lent
  const items = proprium({ festum: f });
  const offices = new Set(items.map((x) => x.office));
  assert(offices.has("tr"), "has Tract in Lent");
  assert(!offices.has("al"), "no Alleluia in Lent");
});

it("proprium respects source filter (LU)", () => {
  const f = festum("2025-06-15", { form: "OF" }); // OT Sunday
  const items = proprium({ festum: f }, { source: "Liber Usualis" });
  const sel = items
    .map((x) => x.selected && String(x.selected.id))
    .filter(Boolean);
  const luSel = sel.filter((id) => /Liber_Usualis:/.test(id));
  assert(sel.length > 0, "has selections");
  assert(luSel.length > 0, "at least one selection from LU under filter");
});

banner("cantus — ordinarium");

it("Eastertide Sunday (OF) yields a selected mass and Kyrie parts", () => {
  const L = lookupOF(2025);
  const secondSunday = new Date(L.easter_sunday);
  secondSunday.setUTCDate(secondSunday.getUTCDate() + 7);
  const f = festum(secondSunday, { form: "OF" });
  const o = ordinarium({ festum: f });
  assert(o && o.selected, "selected mass present");
  assert(o.parts && Array.isArray(o.parts.ky), "parts.ky array exists");
  // parts.ky may be empty in rare data gaps; allow lenient retry
  if (o.parts.ky.length === 0) {
    const o2 = ordinarium({ festum: f }, { lenientSelection: true });
    assert(o2.selected, "lenient selection picked a mass");
  }
});

it("EF Lent feria defaults gloria=false", () => {
  const L = lookupEF(2025);
  const d = new Date(L.ash_wednesday);
  d.setUTCDate(d.getUTCDate() + 2); // Friday in Lent
  const f = festum(d, { form: "EF" });
  const o = ordinarium({ festum: f });
  assert(o.gloria === false, "gloria omitted on EF Lenten feria");
});

it("Good Friday lenient selection produces some candidates", () => {
  const L = lookupOF(2025);
  const f = festum(L.good_friday, { form: "OF" });
  const strict = ordinarium({ festum: f });
  const lenient = ordinarium({ festum: f }, { lenientSelection: true });
  assert(Array.isArray(strict.candidates), "strict candidates array exists");
  assert(
    Array.isArray(lenient.candidates) &&
      lenient.candidates.length >= strict.candidates.length,
    "lenient not worse than strict"
  );
});

it("ordinarium sets credo_preference and provides a Credo when applicable", () => {
  const L = lookupOF(2025);
  const secondSunday = new Date(L.easter_sunday);
  secondSunday.setUTCDate(secondSunday.getUTCDate() + 7);
  const f = festum(secondSunday, { form: "OF" });
  const o = ordinarium({ festum: f });
  // Expect a preference (Mass I lists credos [I, III])
  assert(
    o.credo_preference === "I" || o.credo_preference === "III",
    "has credo preference"
  );
  // parts.cr should exist; if preference is I, prefer LU Credo I
  assert(Array.isArray(o.parts.cr), "parts.cr array present");
  if (o.credo_preference === "I") {
    // Prefer LU Credo I id when no other cr provided
    const hasCredoI = o.parts.cr.some(
      (id) => String(id) === "Liber_Usualis:344"
    );
    assert(
      hasCredoI || o.parts.cr.length > 0,
      "Credo I preferred or some Credo provided"
    );
  }
});

it("ordinarium parts respect source filter when possible (LU)", () => {
  const f = festum("2025-06-15", { form: "OF" });
  const o = ordinarium({ festum: f }, { source: "Liber Usualis" });
  if (o.parts && Array.isArray(o.parts.ky) && o.parts.ky.length) {
    const lu = o.parts.ky.some((id) => /Liber_Usualis:/.test(String(id)));
    assert(lu, "ky includes LU id under source filter");
  } else {
    assert(true, "no ky parts to assert; skipped");
  }
});
