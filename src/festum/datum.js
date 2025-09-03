// src/festum/datum.js

function pascha(year) {
  const t = Math.trunc;
  const G = year % 19;
  const C = Math.trunc(year / 100);
  const H =
    (C - Math.trunc(C / 4) - Math.trunc((8 * C + 13) / 25) + 19 * G + 15) % 30;
  const I =
    H -
    Math.trunc(H / 28) *
      (1 - Math.trunc(29 / (H + 1)) * Math.trunc((21 - G) / 11));
  const J = (year + Math.trunc(year / 4) + I + 2 - C + Math.trunc(C / 4)) % 7;
  const L = I - J;
  const m = 3 + Math.trunc((L + 40) / 44);
  const d = L + 28 - 31 * Math.trunc(m / 4);
  return new Date(year, m - 1, d); // local date (not UTC)
}

const DAY = 86400000;
const addDays = (d, n) => new Date(new Date(d).getTime() + n * DAY);
const previousSunday = (d) => addDays(d, -((d.getDay() + 7 - 0) % 7));
const nextSunday = (d) => addDays(d, (7 - d.getDay()) % 7);

/**
 * Common Easter-anchored landmarks shared by both 1962 and 1974.
 * Returns objects keyed by the names both lookups need.
 */
function common(year) {
  const easter_sunday = pascha(year);
  const ash_wednesday = addDays(easter_sunday, -46);
  const septuagesima = addDays(easter_sunday, -63); // EF-only but computed here
  const sexagesima = addDays(easter_sunday, -56); // EF-only
  const quinquagesima = addDays(easter_sunday, -49); // EF-only
  const palm_sunday = addDays(easter_sunday, -7);
  const holy_thursday = addDays(easter_sunday, -3);
  const good_friday = addDays(easter_sunday, -2);
  const holy_saturday = addDays(easter_sunday, -1);
  const ascension_thu = addDays(easter_sunday, 39); // Ascension Thursday
  const pentecost = addDays(easter_sunday, 49);
  const trinity = addDays(pentecost, 7);
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
    trinity,
  };
}

/**
 * 1962 (EF) lookup — uses the shared core, then adds EF-specific dates.
 * Matches your original fields.  :contentReference[oaicite:3]{index=3}
 */
export function lankmarks1962(year) {
  const core = common(year);

  const christmas = new Date(year, 11, 25);
  const epiphany = new Date(year, 0, 6);
  const baptism = new Date(year, 0, 13);

  // EF: Ascension is always Thursday; Corpus Christi is Thursday after Trinity;
  // Sacred Heart is the Friday AFTER the octave of Corpus (EF usage).
  const ascension = core.ascension_thu;
  const corpus_christi = addDays(core.trinity, 4); // Thu after Trinity
  const sacred_heart = addDays(corpus_christi, 8); // Friday after octave

  // Christ the King (EF): last Sunday of October
  const oct31 = new Date(year, 9, 31);
  const christ_king = addDays(
    oct31,
    -(oct31.getDay() === 0 ? 0 : oct31.getDay())
  );

  // Advent Sunday (EF): 1st Sunday of Advent is the Sunday between Nov 27–Dec 3.
  // Compute from Christmas: the Sunday 4 weeks before Christmas (inclusive window).
  const advent_sunday = addDays(
    christmas,
    (christmas.getDay() === 0 ? -28 : -21) - christmas.getDay()
  );

  return {
    christmas,
    epiphany,
    baptism,
    easter_sunday: core.easter_sunday,
    septuagesima: core.septuagesima,
    sexagesima: core.sexagesima,
    quinquagesima: core.quinquagesima,
    ash_wednesday: core.ash_wednesday,
    palm_sunday: core.palm_sunday,
    holy_thursday: core.holy_thursday,
    good_friday: core.good_friday,
    holy_saturday: core.holy_saturday,
    pentecost: core.pentecost,
    trinity: core.trinity,
    ascension,
    corpus_christi,
    sacred_heart,
    christ_king,
    advent_sunday,
  };
}

/**
 * 1974 (OF) lookup — builds on the shared core, adds OF rules & typical transfers.
 * Options let you transfer Epiphany, Ascension, Corpus to Sunday.
 */
export function lankmarks1974(year, opts = {}) {
  const tr = {
    ascension: false,
    epiphany: false,
    corpusChristi: false,
    ...(opts.transfer || {}),
  };
  const core = common(year);

  const christmas = new Date(year, 11, 25);

  // Epiphany: fixed Jan 6 or Sunday between Jan 2–8
  const epiphanyFixed = new Date(year, 0, 6);
  const epiphany = tr.epiphany
    ? previousSunday(new Date(year, 0, 8)) // Sunday in 2–8 Jan
    : epiphanyFixed;

  // Baptism of the Lord:
  // - If Epiphany is Sun, Baptism is Monday after (OF rubrics)
  // - Otherwise, the Sunday after Epiphany
  let baptism = nextSunday(epiphany);
  if (epiphany.getDay() === 0) baptism = addDays(epiphany, 1);

  // Ascension: Thursday or transferred to Sunday
  const ascension = tr.ascension
    ? addDays(core.ascension_thu, 3)
    : core.ascension_thu;

  // Pentecost & Trinity are shared (from core). Corpus: Thu after Trinity or transferred to Sunday
  const corpusThu = addDays(core.trinity, 4);
  const corpus_christi = tr.corpusChristi ? addDays(corpusThu, 3) : corpusThu;

  // Sacred Heart (OF): Friday after Corpus Christi
  const sacred_heart = addDays(corpus_christi, 1);

  // Advent I (OF): the 4th Sunday before Christmas (Sunday before Nov 27–Dec 3 rule)
  const cSun = previousSunday(christmas);
  const advent_sunday = addDays(cSun, -21);

  // Christ the King (OF): Sunday before Advent I
  const christ_king = addDays(advent_sunday, -7);

  return {
    christmas,
    epiphany,
    baptism,
    easter_sunday: core.easter_sunday,
    ash_wednesday: core.ash_wednesday,
    palm_sunday: core.palm_sunday,
    holy_thursday: core.holy_thursday,
    good_friday: core.good_friday,
    holy_saturday: core.holy_saturday,
    pentecost: core.pentecost,
    trinity: core.trinity,
    ascension,
    corpus_christi,
    sacred_heart,
    advent_sunday,
    christ_king,
  };
}
