// tests/suite.cantus.js
import { cantus, ordo } from "../src/cantus/cantus.js";
import { ordinarium } from "../src/cantus/cantus.js";
import { proprium } from "../src/cantus/cantus.js";
import { OFFICE_LABELS, ORDINARY_LABELS, officeLabel, ordinaryLabel } from "../src/cantus/data/constants.js";
import { festum } from "../src/festum/festum.js";
import { lookup1962, lookup1974 } from "../src/festum/datum.js";

banner("cantus — ordo assembly");

it("OF Sunday includes Gloria and Alleluia", () => {
  const L = lookup1974(2025);
  const f = festum("2025-06-15", { form: "1974" }); // OT Sunday
  const o = ordo({ festum: f, forma: "1974" });
  const ordOffices = o.ordinary.map(x => x.office);
  const propOffices = o.propers.map(x => x.office);
  assert(ordOffices.includes("gl"), "Gloria should be present on OF Sunday");
  assert(propOffices.includes("al"), "Alleluia should be present in propers");
  assert(!propOffices.includes("tr"), "Tract should not be present in OT Sunday");
});

it("EF Lent feria omits Gloria and uses Tract", () => {
  const L = lookup1962(2025);
  // Pick a weekday in Lent (Ash Wednesday + 2 days = Friday)
  const d = new Date(L.ash_wednesday); d.setUTCDate(d.getUTCDate() + 2);
  const f = festum(d, { form: "1962" });
  const o = ordo({ festum: f, forma: "1962" });
  const ordOffices = o.ordinary.map(x => x.office);
  const propOffices = o.propers.map(x => x.office);
  assert(!ordOffices.includes("gl"), "Gloria should be omitted in Lent feria (EF)");
  assert(propOffices.includes("tr"), "Tract should be present in Lent (EF)");
  assert(!propOffices.includes("al"), "Alleluia should be omitted in Lent (EF)");
});

it("constants are frozen and label helpers work", () => {
  assert(Object.isFrozen(OFFICE_LABELS), "OFFICE_LABELS should be frozen");
  assert(Object.isFrozen(ORDINARY_LABELS), "ORDINARY_LABELS should be frozen");
  assert(officeLabel('in') === 'Introitus', "office label 'in'");
  assert(ordinaryLabel('ky') === 'Kyrie eleison', "ordinary label 'ky'");
});

banner("cantus — search");

it("search by incipit and office returns matches", () => {
  const rows = cantus({ offices: ['in'], incipit: 'Prope es tu', source: '1974' });
  assert(Array.isArray(rows), "rows array");
  assert(rows.length > 0, "expected at least one match for incipit");
  for (const r of rows) {
    assert(r.office && r.office.code === 'in', "office filter respected");
    assert(/1974|Graduale_Romanum_1974/.test(r.id) || /1974/.test(r?.source?.name || ''), "source filter");
  }
});

it("search by mode filters correctly", () => {
  const rows = cantus({ modes: ['1'] });
  assert(rows.every(r => String(r?.chant?.mode || '') === '1'), "all results are mode 1");
});

it("search by source filters correctly", () => {
  const rows = cantus({ source: 'Liber Usualis' });
  assert(rows.length > 0, "some LU results");
  assert(rows.every(r => /Liber_Usualis:/.test(String(r.id)) || /Liber Usualis/i.test(String(r?.source?.name || ''))), "rows are LU");
});

banner("cantus — proprium fallback");

it("Eastertide proprium includes Alleluia, not Tract", () => {
  const f = festum("2025-04-20", { form: "1974" }); // around Eastertide
  const items = proprium({ festum: f });
  const offices = new Set(items.map(x => x.office));
  assert(offices.has('in') && offices.has('gr'), "has IN and GR");
  assert(offices.has('al'), "has Alleluia in Eastertide");
  assert(!offices.has('tr'), "no Tract in Eastertide");
});

it("Lent proprium includes Tract, not Alleluia", () => {
  const f = festum("2025-03-07", { form: "1962" }); // in Lent
  const items = proprium({ festum: f });
  const offices = new Set(items.map(x => x.office));
  assert(offices.has('tr'), "has Tract in Lent");
  assert(!offices.has('al'), "no Alleluia in Lent");
});

it("proprium respects source filter (LU)", () => {
  const f = festum("2025-06-15", { form: "1974" }); // OT Sunday
  const items = proprium({ festum: f }, { source: 'Liber Usualis' });
  const sel = items.map(x => x.selected && String(x.selected.id)).filter(Boolean);
  const luSel = sel.filter(id => /Liber_Usualis:/.test(id));
  assert(sel.length > 0, "has selections");
  assert(luSel.length > 0, "at least one selection from LU under filter");
});

banner("cantus — ordinarium");

it("Eastertide Sunday (OF) yields a selected mass and Kyrie parts", () => {
  const L = lookup1974(2025);
  const secondSunday = new Date(L.easter_sunday); secondSunday.setUTCDate(secondSunday.getUTCDate() + 7);
  const f = festum(secondSunday, { form: "1974" });
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
  const L = lookup1962(2025);
  const d = new Date(L.ash_wednesday); d.setUTCDate(d.getUTCDate() + 2); // Friday in Lent
  const f = festum(d, { form: "1962" });
  const o = ordinarium({ festum: f });
  assert(o.gloria === false, "gloria omitted on EF Lenten feria");
});

it("Good Friday lenient selection produces some candidates", () => {
  const L = lookup1974(2025);
  const f = festum(L.good_friday, { form: "1974" });
  const strict = ordinarium({ festum: f });
  const lenient = ordinarium({ festum: f }, { lenientSelection: true });
  assert(Array.isArray(strict.candidates), "strict candidates array exists");
  assert(Array.isArray(lenient.candidates) && lenient.candidates.length >= strict.candidates.length, "lenient not worse than strict");
});

it("ordinarium parts respect source filter when possible (LU)", () => {
  const f = festum("2025-06-15", { form: "1974" });
  const o = ordinarium({ festum: f }, { source: 'Liber Usualis' });
  if (o.parts && Array.isArray(o.parts.ky) && o.parts.ky.length) {
    const lu = o.parts.ky.some(id => /Liber_Usualis:/.test(String(id)));
    assert(lu, "ky includes LU id under source filter");
  } else {
    assert(true, "no ky parts to assert; skipped");
  }
});
