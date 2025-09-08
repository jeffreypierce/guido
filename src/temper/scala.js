// src/temperamentum/scala.js — pure scale generators and helpers
import { toCent, fromCent } from "../aux/index.js";

const DIAPENTE = 3 / 2; // perfect fifth
const GREATER_TONE = 9 / 8;
const LESSER_TONE = 10 / 9;
const SYNTONIC_COMMA = GREATER_TONE / LESSER_TONE; // 81:80

function normalizeOctave(r) {
  let x = Number(r);
  while (x >= 2) x /= 2;
  while (x < 1) x *= 2;
  return x;
}

function displayRatio(dec) {
  if (dec == 0 || isNaN(dec)) return "0:0";
  const a = Math.abs(dec);
  let p = 1 / 10 ** 5;
  let n = 0;
  let d = 1;
  let r;
  while (true) {
    r = n / d;
    if (Math.abs((r - a) / a) < p) break;
    if (r < a) n++;
    else d++;
  }
  return `${dec < 0 ? -n : n}:${d}`;
}

export function meantone({ comma = 1 / 4 } = {}) {
  // Tempered fifth: (3/2) * (81/80)^(-comma)
  const temperedFifth = DIAPENTE * (1 / SYNTONIC_COMMA) ** comma;
  const cents = [0];
  for (let k = 1; k <= 6; k++) {
    const up = normalizeOctave(temperedFifth ** k);
    const dn = normalizeOctave(temperedFifth ** -k);
    cents.push(toCent(up));
    cents.push(toCent(dn));
  }
  const mc = Array.from(new Set(cents.map((c) => ((c % 1200) + 1200) % 1200)));
  mc.sort((a, b) => a - b);
  return {
    name: `meantone(${comma})`,
    cents: mc,
    ratios: mc.map(fromCent),
    display: mc.map(displayRatio),
  };
}

export function pythagorean() {
  // Pythagorean = meantone with zero syntonic tempering
  const p = meantone({ comma: 0 });
  return {
    name: "pythagorean",
    cents: p.cents,
    ratios: p.ratios,
    display: p.ratios.map(displayRatio),
  };
}

export function just() {
  // Start from pure (Pythagorean) and apply simple 5-limit adjustments
  const base = meantone({ comma: 0 }).cents.map(fromCent);
  const tem = base.map((x, i) => {
    // Basic hacks to reflect Ptolemy intense diatonic flavor
    if (i === 1) x = 16 / 15; //JustDiatonicSemitone;
    if (i === 6) x = 45 / 32; //JustAug4;
    if (i === 3 || i === 8 || i === 10) x *= SYNTONIC_COMMA;
    if (i === 4 || i === 9 || i === 11) x /= SYNTONIC_COMMA;
    return x;
  });
  const cents = tem
    .map(toCent)
    .map((c) => ((c % 1200) + 1200) % 1200)
    .sort((a, b) => a - b);
  const ratios = cents.map(fromCent);
  return {
    name: "just",
    cents,
    ratios,
    display: ratios.map(displayRatio),
  };
}

export function et() {
  const et = Array.from({ length: 12 }, (_, i) => (i * 1200) / 12);
  const ratios = et.map(fromCent);
  return { name: "et", cents: et, ratios, display: ratios.map(displayRatio) };
}
export function scala(name = "just", opts = {}) {
  switch (String(name).toLowerCase()) {
    case "pythag":
    case "pythagorean":
      return pythagorean();
    case "meantone":
      return meantone(opts);
    case "just":
    case "ptolemy":
      return just();
    case "et":
    case "equal": {
    }
    default:
      return just();
  }
}

export default { scala, pythagorean, meantone, just };
