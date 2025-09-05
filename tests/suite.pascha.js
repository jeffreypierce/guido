// tests/suite.pascha.js — Easter calculators
import { pascha, paschaJulian } from "../src/festum/datum.js";

banner("datum — pascha calculators");

const CASES = new Map([
  [1990, "1990-04-15"],
  [2000, "2000-04-23"],
  [2010, "2010-04-04"],
  [2016, "2016-03-27"],
  [2019, "2019-04-21"],
  [2020, "2020-04-12"],
  [2021, "2021-04-04"],
  [2022, "2022-04-17"],
  [2023, "2023-04-09"],
  [2024, "2024-03-31"],
  [2025, "2025-04-20"],
]);

function ymd(d) {
  const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}

it("Gregorian pascha matches known dates", () => {
  for (const [y, exp] of CASES.entries()) {
    const got = ymd(pascha(y));
    assert(got === exp, `Year ${y}: expected ${exp}, got ${got}`);
  }
});

it("Pre-1583 pascha routes to Julian calculator", () => {
  for (const y of [1400, 1500, 1570, 1582]) {
    const a = ymd(pascha(y));
    const b = ymd(paschaJulian(y));
    assert(a === b, `Year ${y}: pascha != paschaJulian (${a} vs ${b})`);
  }
});

