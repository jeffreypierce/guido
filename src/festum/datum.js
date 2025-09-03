// src/festum/datum.js
// Shared, dependency-free lookup logic for EF (1962) and OF (1974)
// Returns keys that MATCH your calendar.json IDs, so no remapping is needed.

const DAY = 86400000;
const addDays = (d, n) => new Date(new Date(d).getTime() + n * DAY);
const previousSunday = (d) => addDays(d, -((d.getDay() + 7 - 0) % 7));
const nextSunday = (d) => addDays(d, (7 - d.getDay()) % 7);

/** Computus (Meeus/Jones/Butcher) — Gregorian Easter */
export function pascha(year) {
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

/** Easter-anchored core shared by both forms */
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
 * 1962 (EF) lookup with calendar-ID keys for movables.
 * Keys returned (subset shown): christmas, epiphany, baptism, advent_sunday,
 * ash_wednesday, easter_sunday, pentecost,
 * ✨ holy_trinity, corpus_christi, sacred_heart, ascension, christ_king, palm_sunday
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
    palm_sunday: core.palm_sunday,
    ascension,
    holy_trinity: core.holy_trinity,
    corpus_christi,
    sacred_heart,
    christ_king,
  };
}

/**
 * 1974 (OF) lookup with calendar-ID keys for movables.
 * Supports common transfers via opts.transfer: { epiphany, ascension, corpusChristi } (booleans).
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
    palm_sunday: core.palm_sunday,
    ascension,
    holy_trinity: core.holy_trinity,
    corpus_christi,
    sacred_heart,
    christ_king,
  };
}
