import { scala } from "./scala.js";
import { Modes } from "./data/modes.js";
import { roman } from "../aux/index.js";

// Internal helpers kept local to chant use-cases
const PITCH_CLASS = [
  "C",
  "C#",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

// Diatonic selection with both B and Bb available (chant practice)
// 1 = in gamut, 0 = excluded; index 0 = C, 9 = A
const DIATONIC_WITH_B_AND_BB = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1];

function rotate(arr, n) {
  const k = ((n % arr.length) + arr.length) % arr.length;
  return arr.slice(k).concat(arr.slice(0, k));
}

function canonModeKey(input) {
  // Accept: number (1..8), roman ('I'..'VIII'), or alias ('dorian', etc.)
  if (typeof input === "number") {
    const key = roman(input); // -> 'I', 'II', ...
    return Modes.has(key) ? key : undefined;
  }
  if (typeof input === "string") {
    const s = input.trim();
    if (Modes.has(s)) return s; // roman key
    // try number as string
    const n = Number(s);
    if (!Number.isNaN(n)) {
      const key = roman(n);
      if (Modes.has(key)) return key;
    }
    // try alias
    for (const [k, v] of Modes) {
      if (
        v?.identity?.alias &&
        v.identity.alias.toLowerCase() === s.toLowerCase()
      ) {
        return k;
      }
    }
  }
  return undefined;
}

class Temper {
  constructor(opts = {}) {
    const modeKey = canonModeKey(opts.mode ?? 1) || "I";
    this.modus = Modes.get(modeKey);
    this.tabula = new Map(); // keyed by pitch-class (0..11)

    const LA4 = opts.LA4 || opts.LA4 || 440;
    const LA0 = LA4 / 2 ** 4;
    const isAuthentic = Boolean(opts.authentic ?? true);

    const { structure } = this.modus || {};
    const finalis = isAuthentic ? structure.final : structure.root; // 0..11; 9 corresponds to A
    const transpose = (opts.transpose | 0) % 12; // chromatic transposition in semitones

    // temperament (12 pitch-class ratios within the octave)
    const sc = scala(opts.scale || "just", opts.scaleOptions || {});
    const ratios = sc?.ratios || [];
    if (ratios.length !== 12) {
      // Guard: normalize to 12 items if generator returned a different length
      // Prefer the first 12 unique, sorted by cents ordering
      const arr = (sc?.cents || []).slice(0, 12);
      while (arr.length < 12) arr.push((arr[arr.length - 1] || 0) + 100);
      arr.sort((a, b) => a - b);
      // convert to ratios
      const toRatio = (c) => 2 ** (c / 1200);
      while (arr.length > 12) arr.pop();
      arr.forEach((c, i) => (ratios[i] = toRatio(c)));
    }

    // Select diatonic+Bb/B gamut relative to the finalis (mode) and build table
    const steps = rotate(DIATONIC_WITH_B_AND_BB, finalis);
    const anchor = (12 + 9 - finalis - transpose) % 12; // anchor so A0 aligns to A pitch-class

    ratios.forEach((ratio, chromaStep) => {
      if (!steps[chromaStep]) return; // skip chromatic degrees outside chant gamut
      const p = (12 + chromaStep + finalis) % 12; // pitch-class before global transpose
      const chroma = (12 + p + transpose) % 12; // transposed pitch-class
      let freq = (ratio * A0) / ratios[anchor];
      // keep within base octave for non-ET tunings
      const ref = A0 / ratios[9];
      if (Math.log2(freq / ref) > 0.98) freq /= 2;
      this.tabula.set(p, {
        freq,
        step: chromaStep,
        chroma,
        ratio,
        pc: PITCH_CLASS[p],
      });
    });

    this.meta = Object.freeze({
      modeKey,
      modeNumber: this.modus?.identity?.mode,
      authentic: isAuthentic,
      finalis,
      transpose,
      scale: sc?.name || String(opts.scale || "just"),
      A4,
    });
  }

  /** Frequency (Hz) for a given pitch-class index (0..11, 0=C). */
  freqOf(pc) {
    const k = ((pc % 12) + 12) % 12;
    return this.tabula.get(k)?.freq;
  }

  /** Full table of tuned degrees keyed by pitch-class. */
  table() {
    return this.tabula;
  }

  /** Human helper: label a pitch-class. */
  nameOf(pc) {
    const k = ((pc % 12) + 12) % 12;
    return PITCH_CLASS[k];
  }
}

export default Temper;
