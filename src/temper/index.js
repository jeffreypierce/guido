import { scala } from "./scala.js";
import { Modes } from "./data/modes.js";
import HandData from "./data/hand.js";
import { roman, toCent, fromCent } from "../aux/index.js";

// Internal helpers kept local to chant use-cases

// Diatonic selection with both B and Bb available (chant practice)
// 1 = in gamut, 0 = excluded; index 0 = C, 9 = A
const STEPS = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1];

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
const NAME_TO_CHROMA = new Map([
  ["C", 0],
  ["B#", 0],
  ["C#", 1],
  ["Db", 1],
  ["D", 2],
  ["D#", 3],
  ["Eb", 3],
  ["E", 4],
  ["Fb", 4],
  ["E#", 5],
  ["F", 5],
  ["F#", 6],
  ["Gb", 6],
  ["G", 7],
  ["G#", 8],
  ["Ab", 8],
  ["A", 9],
  ["A#", 10],
  ["Bb", 10],
  ["B", 11],
  ["Cb", 11],
]);

const SOLFEGE_TO_CHROMA = new Map([
  ["DO", 0],
  ["UT", 0], // medieval usage
  ["UI", 1],
  ["DI", 1],
  ["RE", 2],
  ["ME", 3],
  ["MI", 4],
  ["FA", 5],
  ["FU", 6],
  ["SOL", 7],
  ["SO", 7],
  ["LE", 8],
  ["LA", 9],
  ["TE", 10],
  ["TI", 11],
  ["SI", 11], // fixed-do (Latin)
]);

// base fixed-do for diatonic pcs
const CHROMA_TO_SOLFEGE_BASE = new Map([
  [0, "UT"],
  [2, "RE"],
  [4, "MI"],
  [5, "FA"],
  [7, "SOL"],
  [9, "LA"],
  [10, "TE"],
  [11, "TI"],
]);

// Build a MIDI -> hand entries index once for Guidonian lookups
const HAND_BY_MIDI = (() => {
  const m = new Map();
  for (const e of HandData) {
    const arr = m.get(e.midi) || [];
    arr.push(e);
    m.set(e.midi, arr);
  }
  return m;
})();

function rotate(arr, n) {
  const k = ((n % arr.length) + arr.length) % arr.length;
  return arr.slice(k).concat(arr.slice(0, k));
}

// Cache for diatonic degree maps keyed by finalis (0..11)
const STEP_MAP_CACHE = new Map();
function stepMapFor(finalis = 0) {
  const f = ((finalis % 12) + 12) % 12;
  if (STEP_MAP_CACHE.has(f)) return STEP_MAP_CACHE.get(f);
  const map = new Map();
  let degree = -1;
  for (let j = 0; j < 12; j++) {
    const pc = (f + j) % 12;
    if (!STEPS[pc]) continue;
    if (j >= 10) {
      // both penultimate and leading tone map to degree 6
      map.set(pc, 6);
    } else {
      degree += 1;
      map.set(pc, degree);
    }
  }
  STEP_MAP_CACHE.set(f, map);
  return map;
}

function normalizeMode(m) {
  // Accept: number (1..8), roman ('I'..'VIII'), or alias ('dorian', etc.)
  if (typeof m === "number") {
    const key = roman(m); // -> 'I', 'II', ...
    return Modes.has(key) ? key : undefined;
  }
  if (typeof m === "string") {
    const s = m.trim();
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
  console.error(`mode ${m} not defined`);
  return undefined;
}

// --- Note parsing helpers (non-breaking, standalone) ---

function normalizeAcc(a = "") {
  if (a === "♯") return "#";
  if (a === "♭") return "b";
  return a;
}

function toName(chroma, octave) {
  const pc = PITCH_CLASS[((chroma % 12) + 12) % 12];
  return typeof octave === "number" ? `${pc}${octave}` : pc;
}

function toMidi(chroma, octave) {
  if (typeof chroma !== "number" || typeof octave !== "number")
    return undefined;
  // MIDI standard: C-1 = 0, A4 = 69
  return (octave + 1) * 12 + (((chroma % 12) + 12) % 12);
}

function resolveFinalis(opts) {
  if (!opts || typeof opts === "number") return 0;
  if (typeof opts.finalis === "number") return ((opts.finalis % 12) + 12) % 12;
  if (opts.mode != null) {
    const mk = normalizeMode(opts.mode) || "I";
    const modus = Modes.get(mk);
    const isAuthentic = Boolean(opts.authentic ?? true);
    const base = isAuthentic ? modus?.structure?.final : modus?.structure?.root;
    const tr = (opts.transpose | 0) % 12;
    if (typeof base === "number") return ((base + tr) % 12 + 12) % 12;
  }
  return 0;
}

function finalizeNote({ kind, input, chroma, octave, midi, solfege, stepFinalis }) {
  const c = typeof chroma === "number" ? ((chroma % 12) + 12) % 12 : undefined;
  let o = typeof octave === "number" ? octave : undefined;
  let m = typeof midi === "number" ? midi : undefined;
  if (typeof c === "number" && typeof o === "number" && typeof m !== "number") {
    m = toMidi(c, o);
  }
  if (typeof m === "number" && (typeof c !== "number" || typeof o !== "number")) {
    const chromaFromMidi = ((m % 12) + 12) % 12;
    const octaveFromMidi = Math.floor(m / 12) - 1;
    chroma = typeof c === "number" ? c : chromaFromMidi;
    octave = typeof o === "number" ? o : octaveFromMidi;
  } else {
    chroma = c;
    octave = o;
  }
  const name = typeof chroma === "number" ? toName(chroma, octave) : undefined;
  const baseSolfege = typeof chroma === "number" ? CHROMA_TO_SOLFEGE_BASE.get(chroma) : undefined;
  const hand = typeof m === "number" ? toHand(m) : undefined;
  let step;
  if (typeof chroma === "number") {
    const stepMap = stepMapFor(stepFinalis ?? 0);
    step = stepMap.get(chroma);
  }
  return {
    kind,
    input,
    chroma,
    octave,
    midi: m,
    name,
    solfege: solfege || baseSolfege,
    hand,
    step,
  };
}

const toHand = (midi) => {
  const choices = HAND_BY_MIDI.get(midi);
  if (!choices || !choices.length) return undefined;
  // prefer naturale, then durum, then molle
  const pref = ["naturale", "durum", "molle"];
  for (const p of pref) {
    const found = choices.find((x) => x.hexachord === p);
    if (found) {
      const { id, hexachord, syllable, hand_position } = found;
      return { id, hexachord, syllable, position: hand_position };
    }
  }
  const { id, hexachord, syllable, hand_position } = choices[0];
  return { id, hexachord, syllable, position: hand_position };
};

/**
 * Parse a flexible note input into a normalized object.
 * Accepts: midi number, note name (e.g., 'Bb3', 'C#4'),
 * solfege ('do', 're', ... with optional accident and octave),
 * or { chroma, octave }.
 * This is a minimal scaffold; we can enrich the payload later.
 */
export function note(input, opts = {}) {
  // Support shorthand second arg as number: note(x, 4)
  const defaultOctave = Number.isInteger(
    typeof opts === "number" ? opts : opts.defaultOctave
  )
    ? typeof opts === "number"
      ? opts
      : opts.defaultOctave
    : 4;
  const stepFinalis = resolveFinalis(opts);

  // Number or numeric string -> MIDI
  if (
    (typeof input === "number" ||
      (typeof input === "string" && /^-?\d+$/.test(input.trim()))) &&
    input < 127 &&
    input > 0
  ) {
    const midi = Number(input);
    return finalizeNote({ kind: "midi", input, midi, stepFinalis });
  }

  // Object with {chroma, octave}
  if (input && typeof input === "object") {
    const { chroma, octave } = input;
    const c = Number(chroma);
    const o = typeof octave === "number" ? octave : defaultOctave;
    const midi = toMidi(c, o);
    return finalizeNote({ kind: "object", input, chroma: c, octave: o, midi, stepFinalis });
  }

  if (typeof input === "string") {
    const s = input.trim();

    // Note name like C#4, Bb3, G, etc.
    const mName = /^([A-Ga-g])([#b♯♭]?)(-?\d+)?$/.exec(s);
    if (mName) {
      const L = mName[1].toUpperCase();
      const acc = normalizeAcc(mName[2] || "");
      const key = `${L}${acc}`;
      const chroma = NAME_TO_CHROMA.get(key);
      const octave = mName[3] !== undefined ? Number(mName[3]) : defaultOctave;
      if (typeof chroma === "number") {
        const midi = toMidi(chroma, octave);
        return finalizeNote({ kind: "name", input, chroma, octave, midi, stepFinalis });
      }
    }

    // Solfege like do4, RE, mib3, sol#5
    const mSol = /^([a-zA-Z]+)([#b♯♭]?)(-?\d+)?$/.exec(s.toLowerCase());
    if (mSol) {
      const syl = mSol[1].toUpperCase();
      const acc = normalizeAcc(mSol[2] || "");
      const base = SOLFEGE_TO_CHROMA.get(syl);
      if (typeof base === "number") {
        let chroma = base;
        if (acc === "#") chroma = (chroma + 1) % 12;
        if (acc === "b") chroma = (chroma + 11) % 12;
        const octave = mSol[3] !== undefined ? Number(mSol[3]) : defaultOctave;
        const midi = toMidi(chroma, octave);
        return finalizeNote({ kind: "solfege", input, chroma, octave, midi, solfege: syl, stepFinalis });
      }
    }
  }

  // Fallback: unknown
  return {
    kind: "unknown",
    input,
    chroma: undefined,
    octave: undefined,
    midi: undefined,
    name: undefined,
  };
}

class Temper {
  constructor(opts = {}) {
    const mk = normalizeMode(opts.mode ?? 1) || "I";
    this.modus = Modes.get(mk);
    this.tabula = new Map(); // keyed by pitch-class (0..11)

    const LA4 = opts.LA4 || 440;
    const LA0 = LA4 / 2 ** 4;
    const isAuthentic = Boolean(opts.authentic ?? true);

    const { structure } = this.modus || {};
    const finalis = isAuthentic ? structure.final : structure.root; // 0..11; 9 corresponds to A
    const transpose = (opts.transpose | 0) % 12; // chromatic transposition in semitones

    // temperament (12 pitch-class ratios within the octave)
    const sc = scala(opts?.scale || "just", opts.scaleOptions || {});
    const ratios = sc?.ratios || [];
    if (ratios.length !== 12) {
      console.error(`scale ${opts.scale} is not vaild`);
      return null;
    }
    // Select diatonic+Bb/B gamut relative to the finalis (mode) and build table
    const steps = rotate(STEPS, finalis);
    const LA = (12 + 9 - finalis - transpose) % 12; // anchor so A0 aligns to A pitch-class

    ratios.forEach((ratio, step) => {
      if (!steps[step]) return; // skip chromatic degrees outside chant gamut
      const p = (12 + step + finalis) % 12; // pitch-class before global transpose
      const chroma = (12 + p + transpose) % 12; // transposed pitch-class
      let freq = (ratio * LA0) / ratios[LA];
      // keep within base octave for non-ET tunings
      const ref = LA0 / ratios[9];
      if (Math.log2(freq / ref) > 0.98) freq /= 2;
      this.tabula.set(p, {
        freq,
        step,
        chroma,
        ratio,
        pc: PITCH_CLASS[chroma],
      });
    });

    this.meta = Object.freeze({
      mode: mk,
      modeNumber: this.modus?.identity?.mode,
      authentic: isAuthentic,
      finalis,
      transpose,
      scale: sc.name,
      LA4,
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
export { Temper };
