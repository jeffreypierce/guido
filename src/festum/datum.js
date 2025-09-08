// src/festum/datum.js
// Shared, dependency-free lookup logic for EF (EF) and OF (1974).
// Returns keys that match `calendar.json` IDs

const DAY = 86400000;
const addDays = (d, n) => new Date(new Date(d).getTime() + n * DAY);
const previousSunday = (d) => addDays(d, -((d.getDay() + 7 - 0) % 7));
const nextSunday = (d) => addDays(d, (7 - d.getDay()) % 7);

/**
 * Gregorian Easter (Meeus/Jones/Butcher).
 * For years < 1583 (pre-Gregorian), delegates to `paschaJulian`.
 * @param {number} year
 * @returns {Date} UTC Date (proleptic Gregorian civil date)
 */
export function pascha(year) {
  if (year < 1583) return paschaJulian(year);
  const t = Math.trunc;
  const G = year % 19;
  const C = t(year / 100);
  const H = (C - t(C / 4) - t((8 * C + 13) / 25) + 19 * G + 15) % 30;
  const I = H - t(H / 28) * (1 - t(29 / (H + 1)) * t((21 - G) / 11));
  const J = (year + t(year / 4) + I + 2 - C + t(C / 4)) % 7;
  const L = I - J;
  const m = 3 + t((L + 40) / 44);
  const d = L + 28 - 31 * t(m / 4);
  return new Date(year, m - 1, d);
}

/**
 * Julian Easter (Julian computus) returned as a proleptic Gregorian UTC Date.
 * Steps:
 *  1) Compute Easter in the Julian calendar.
 *  2) Convert that Julian date to JDN, then to a proleptic Gregorian Date.
 * This matches medieval Western (Julian) computus while keeping JS Date semantics.
 * @param {number} year
 * @returns {Date} UTC Date corresponding to the Julian-calendar Easter
 */
export function paschaJulian(year) {
  // 1) Julian computus (Meeus/Oudin Julian variant)
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31); // 3=March, 4=April
  const day = ((d + e + 114) % 31) + 1;
  // 2) Convert Julian calendar date -> JDN -> proleptic Gregorian Date
  return julianToGregorian(year, month, day);
}

/** Julian calendar date to JDN (Fliegel & Van Flandern). */
function julianToJdn(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083
  );
}

/** JDN to proleptic Gregorian Date */
function julianToGregorian(y, m, d) {
  const jdn = julianToJdn(y, m, d);
  let l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l) / 2447);
  const day = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const month = j + 2 - 12 * l;
  const year = 100 * (n - 49) + i + l;
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Easter-anchored core shared by both forms.
 * @param {number} year
 * @returns {{
 *  easter_sunday: Date,
 *  ash_wednesday: Date,
 *  septuagesima: Date,
 *  sexagesima: Date,
 *  quinquagesima: Date,
 *  palm_sunday: Date,
 *  holy_thursday: Date,
 *  good_friday: Date,
 *  holy_saturday: Date,
 *  ascension_thu: Date,
 *  pentecost: Date,
 *  holy_trinity: Date,
 * }}
 */
function fromEaster(year) {
  const easter_sunday = pascha(year);
  const ash_wednesday = addDays(easter_sunday, -46);
  const septuagesima = addDays(easter_sunday, -63); // EF only (pre-Lent)
  const sexagesima = addDays(easter_sunday, -56); // EF
  const quinquagesima = addDays(easter_sunday, -49); // EF
  const palm_sunday = addDays(easter_sunday, -7);
  const holy_thursday = addDays(easter_sunday, -3);
  const good_friday = addDays(easter_sunday, -2);
  const holy_saturday = addDays(easter_sunday, -1);
  const ascension_thu = addDays(easter_sunday, 39);
  const pentecost = addDays(easter_sunday, 49);
  const holy_trinity = addDays(pentecost, 7); // Sunday after Pentecost
  return {
    easter_sunday,
    ash_wednesday,
    septuagesima,
    sexagesima,
    quinquagesima,
    palm_sunday,
    holy_thursday,
    good_friday,
    holy_saturday,
    ascension_thu,
    pentecost,
    holy_trinity,
  };
}

/**
 * EF (EF) landmarks and movables keyed to `calendar.json` IDs.
 * @typedef Landmarks1962
 * @property {Date} christmas
 * @property {Date} epiphany
 * @property {Date} baptism
 * @property {Date} advent_sunday
 * @property {Date} ash_wednesday
 * @property {Date} easter_sunday
 * @property {Date} pentecost
 * @property {Date} septuagesima
 * @property {Date} sexagesima
 * @property {Date} quinquagesima
 * @property {Date} palm_sunday
 * @property {Date} holy_thursday
 * @property {Date} good_friday
 * @property {Date} holy_saturday
 * @property {Date} ascension
 * @property {Date} holy_trinity
 * @property {Date} corpus_christi
 * @property {Date} sacred_heart
 * @property {Date} christ_king
 */
/**
 * EF (EF) lookup with calendar-ID keys for movables.
 * @param {number} year
 * @returns {Landmarks1962}
 */
export function lookup1962(year) {
  const core = fromEaster(year);

  const christmas = new Date(year, 11, 25);
  const epiphany = new Date(year, 0, 6);
  const baptism = new Date(year, 0, 13);

  // EF: Ascension always Thursday; Corpus Christi Thursday after Trinity;
  // Sacred Heart = Friday AFTER the octave of Corpus (i.e., Corpus + 8 days).
  const ascension = core.ascension_thu;
  const corpus_christi = addDays(core.holy_trinity, 4); // Thu after Trinity
  const sacred_heart = addDays(corpus_christi, 8);

  // Christ the King (EF): last Sunday of October
  const oct31 = new Date(year, 9, 31);
  const christ_king = addDays(
    oct31,
    -(oct31.getDay() === 0 ? 0 : oct31.getDay())
  );

  // Advent I (EF): Sunday between Nov 27–Dec 3; compute from Christmas
  const advent_sunday = addDays(
    christmas,
    (christmas.getDay() === 0 ? -28 : -21) - christmas.getDay()
  );

  return {
    // — landmarks used by season classifiers —
    christmas,
    epiphany,
    baptism,
    advent_sunday,
    ash_wednesday: core.ash_wednesday,
    easter_sunday: core.easter_sunday,
    pentecost: core.pentecost,

    // — EXTRA EF landmarks (pre-Lent) if you need them elsewhere —
    septuagesima: core.septuagesima,
    sexagesima: core.sexagesima,
    quinquagesima: core.quinquagesima,

    // — movable feasts keyed EXACTLY like calendar.json IDs —
    holy_thursday: core.holy_thursday,
    good_friday: core.good_friday,
    holy_saturday: core.holy_saturday,
    palm_sunday: core.palm_sunday,
    ascension,
    holy_trinity: core.holy_trinity,
    corpus_christi,
    sacred_heart,
    christ_king,
  };
}

/**
 * OF (1974) landmarks and movables keyed to `calendar.json` IDs.
 * @typedef Landmarks1974
 * @property {Date} christmas
 * @property {Date} epiphany
 * @property {Date} baptism
 * @property {Date} advent_sunday
 * @property {Date} ash_wednesday
 * @property {Date} easter_sunday
 * @property {Date} pentecost
 * @property {Date} palm_sunday
 * @property {Date} holy_thursday
 * @property {Date} good_friday
 * @property {Date} holy_saturday
 * @property {Date} ascension
 * @property {Date} holy_trinity
 * @property {Date} corpus_christi
 * @property {Date} sacred_heart
 * @property {Date} bvm_church_mom
 * @property {Date} bvm_immaculate_heart
 * @property {Date} christ_king
 */
/**
 * 1974 (OF) lookup with calendar-ID keys for movables.
 * Supports common transfers via opts.transfer: { epiphany, ascension, corpusChristi }.
 * @param {number} year
 * @param {{ transfer?: { epiphany?: boolean, ascension?: boolean, corpusChristi?: boolean } }} [opts]
 * @returns {Landmarks1974}
 */
export function lookup1974(year, opts = {}) {
  const tr = {
    ascension: false,
    epiphany: false,
    corpusChristi: false,
    ...(opts.transfer || {}),
  };
  const core = fromEaster(year);

  const christmas = new Date(year, 11, 25);
  // Holy Family: Sunday within Octave of Christmas (Dec 26–31), or Dec 30 if none
  const dec26 = new Date(year, 11, 26);
  const dec31 = new Date(year, 11, 31);
  let holy_family = addDays(dec26, (7 - dec26.getDay()) % 7);
  if (holy_family > dec31) holy_family = new Date(year, 11, 30);

  // Epiphany: Jan 6 or Sunday between Jan 2–8 (if transferred)
  const epiphanyFixed = new Date(year, 0, 6);
  const epiphany = tr.epiphany
    ? previousSunday(new Date(year, 0, 8))
    : epiphanyFixed;

  // Baptism of the Lord:
  //  - If Epiphany is Sunday: Monday after Epiphany
  //  - Otherwise: the following Sunday
  let baptism = nextSunday(epiphany);
  if (epiphany.getDay() === 0) baptism = addDays(epiphany, 1);

  // Ascension: Thursday (39 days after Easter) or transferred to Sunday
  const ascension = tr.ascension
    ? addDays(core.ascension_thu, 3)
    : core.ascension_thu;

  // Corpus Christi: Thursday after Trinity or transferred to Sunday
  const corpusThu = addDays(core.holy_trinity, 4);
  const corpus_christi = tr.corpusChristi ? addDays(corpusThu, 3) : corpusThu;

  // Sacred Heart (OF): Friday after Corpus Christi
  const sacred_heart = addDays(corpus_christi, 1);

  // Mary, Mother of the Church (OF): Monday after Pentecost (2018+; generic rule here)
  const bvm_church_mom = addDays(core.pentecost, 1);
  // Immaculate Heart of Mary (OF): Saturday after Sacred Heart
  const bvm_immaculate_heart = addDays(sacred_heart, 1);

  // Advent I (OF): 4th Sunday before Christmas
  const cSun = previousSunday(christmas);
  const advent_sunday = addDays(cSun, -21);

  // Christ the King (OF): Sunday before Advent I
  const christ_king = addDays(advent_sunday, -7);

  return {
    // — landmarks used by season classifiers —
    christmas,
    epiphany,
    baptism,
    advent_sunday,
    ash_wednesday: core.ash_wednesday,
    easter_sunday: core.easter_sunday,
    pentecost: core.pentecost,

    // — movable feasts keyed EXACTLY like calendar.json IDs —
    holy_family,
    holy_thursday: core.holy_thursday,
    good_friday: core.good_friday,
    holy_saturday: core.holy_saturday,
    palm_sunday: core.palm_sunday,
    ascension,
    holy_trinity: core.holy_trinity,
    corpus_christi,
    sacred_heart,
    bvm_church_mom,
    bvm_immaculate_heart,
    christ_king,
  };
}
