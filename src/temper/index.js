import { scala } from "./scala.js";
import { Modes } from "./data/modes.js";
import HandData from "./data/hand.js";
import {
  STEPS,
  PITCH_CLASS,
  NAME_TO_CHROMA,
  SOLFEGE_TO_CHROMA,
  CHROMA_TO_SOLFEGE,
  INTERVAL,
} from "./data/constants.js";
import { roman, rotate } from "../aux/index.js";

// Internal helpers kept local to chant use-cases

// // Build a MIDI -> hand entries index once for Guidonian lookups
const HAND_BY_MIDI = (() => {
  const m = new Map();
  for (const e of HandData) {
    const arr = m.get(e.midi) || [];
    arr.push(e);
    m.set(e.midi, arr);
  }
  return m;
})();

// // Cache for diatonic degree maps keyed by finalis (0..11)
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

const SCALE_CACHE = new Map();
function getScale(name = "just", options = {}) {
  const key = `${String(name)}::${JSON.stringify(options || {})}`;
  const cached = SCALE_CACHE.get(key);
  if (cached) return cached;
  const sc = scala(name, options);
  SCALE_CACHE.set(key, sc);
  return sc;
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
function toHand(midi) {
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
}

// --- Shared context + temperament helpers ---

function resolveContext(opts = {}) {
  const o = typeof opts === "object" && opts ? opts : {};
  const mk = o.mode != null ? normalizeMode(o.mode) : undefined;
  const modus = mk ? Modes.get(mk) : undefined;
  const isAuthentic = o.authentic ?? true;
  const baseFinal = modus
    ? isAuthentic
      ? modus?.structure?.final
      : modus?.structure?.root
    : undefined;
  const transpose = Number.isFinite(o.transpose) ? o.transpose | 0 : 0;
  const explicitFinalis = Number.isFinite(o.finalis)
    ? ((o.finalis % 12) + 12) % 12
    : undefined;
  const finalis =
    explicitFinalis ??
    (typeof baseFinal === "number"
      ? (((baseFinal + transpose) % 12) + 12) % 12
      : 0);

  const scaleName = o.scale || "just";
  const scaleOptions = o.scaleOptions || {};
  const sc = getScale(scaleName, scaleOptions);
  const cents = sc?.cents || [];
  const bendRange = Number(o.bendRange ?? (o.pitchBend && o.pitchBend.range));
  return {
    finalis,
    transpose,
    scaleName: sc?.name || scaleName,
    scaleOptions,
    cents,
    bendRange,
  };
}

function getCentsOffset(chroma, ctx) {
  if (typeof chroma !== "number") return undefined;
  const { finalis, transpose, cents } = ctx || {};
  if (!Array.isArray(cents) || cents.length < 12) return undefined;
  const step = (12 + chroma - (finalis ?? 0) - (transpose ?? 0)) % 12;
  const c = Number(cents[step]);
  if (!Number.isFinite(c)) return undefined;
  return c - step * 100;
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
    if (typeof base === "number") return (((base + tr) % 12) + 12) % 12;
  }
  return 0;
}

function finalizeNote({
  kind,
  input,
  chroma,
  octave,
  midi,
  solfege,
  stepFinalis,
}) {
  // Normalize primitives once
  let c = typeof chroma === "number" ? ((chroma % 12) + 12) % 12 : undefined;
  let o = typeof octave === "number" ? octave : undefined;
  let m = typeof midi === "number" ? midi : undefined;

  // Derive missing midi from chroma+octave, or vice-versa from midi
  if (c != null && o != null && m == null) m = toMidi(c, o);
  if (m != null && (c == null || o == null)) {
    c = ((m % 12) + 12) % 12;
    o = Math.floor(m / 12) - 1;
  }

  // Build derived fields using normalized values
  const name = c != null ? toName(c, o) : undefined;
  const baseSolfege = c != null ? CHROMA_TO_SOLFEGE.get(c) : undefined;
  const hand = m != null ? toHand(m)?.id : undefined;
  const step = stepMapFor(stepFinalis ?? 0).get(c);

  return {
    kind,
    input,
    chroma: c,
    octave: o,
    midi: m,
    name,
    solfege: solfege || baseSolfege,
    hand,
    step,
  };
}

function transposeOutput(out, semis = 0, stepFinalis = 0, bendOpts = {}) {
  const t = Number(semis) | 0 || 0;
  if (
    !t ||
    !out ||
    typeof out.midi !== "number" ||
    typeof out.chroma !== "number"
  )
    return out;
  const origChroma = out.chroma;
  const midi = out.midi + t;
  const chroma = (((out.chroma + t) % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const name = toName(chroma, octave);
  const fixedSolfege = CHROMA_TO_SOLFEGE.get(chroma) || out.solfege;
  const movableSolfege = CHROMA_TO_SOLFEGE.get(origChroma) || out.solfege;
  const hand = toHand(midi)?.id;
  const step = stepMapFor(stepFinalis ?? 0).get(chroma);
  const res = {
    ...out,
    chroma,
    octave,
    midi,
    name,
    solfege: { fixed: fixedSolfege, movable: movableSolfege },
    hand,
    step,
  };
  // Recompute pitch bend in the transposed context if requested
  if (
    bendOpts &&
    Number(
      bendOpts.bendRange ?? (bendOpts.pitchBend && bendOpts.pitchBend.range)
    ) > 0
  ) {
    const pb = computePitchBend(chroma, midi, bendOpts);
    if (pb) res.pitchBend = pb;
  }
  return res;
}

function computePitchBend(chroma, midi, ctx = {}) {
  if (typeof chroma !== "number" || typeof midi !== "number") return undefined;
  const full = resolveContext(ctx);
  const bendRange = Number(full.bendRange);
  if (!(bendRange > 0)) return undefined;
  const offsetCents = getCentsOffset(chroma, full);
  if (!Number.isFinite(offsetCents)) return undefined;
  const offsetSemis = offsetCents / 100;
  // 14-bit pitch bend: 0..16383, center=8192
  const center = 8192;
  let value14 = Math.round(center + center * (offsetSemis / bendRange));
  if (value14 < 0) value14 = 0;
  if (value14 > 16383) value14 = 16383;
  const lsb = value14 & 0x7f;
  const msb = (value14 >> 7) & 0x7f;
  return {
    value14,
    msb,
    lsb,
    range: bendRange,
    semitones: offsetSemis,
    cents: offsetCents,
    scale: full.scaleName,
  };
}

/**
 * Parse a flexible note input into a normalized object.
 * Accepts: midi number, note name (e.g., 'Bb3', 'C#4'),
 * solfege ('do', 're', ... with optional accident and octave),
 * or { chroma, octave }.
 * This is a minimal scaffold; we can enrich the payload later.
 */
function note(input, opts = {}) {
  // Support shorthand second arg as number: note(x, 4)
  const defaultOctave = Number.isInteger(
    typeof opts === "number" ? opts : opts.defaultOctave
  )
    ? typeof opts === "number"
      ? opts
      : opts.defaultOctave
    : 4;
  const stepFinalis = resolveFinalis(opts);
  const ctx = resolveContext(opts);
  let out;

  // Number or numeric string -> MIDI
  if (
    (typeof input === "number" ||
      (typeof input === "string" && /^-?\d+$/.test(input.trim()))) &&
    input < 127 &&
    input > 0
  ) {
    const midi = Number(input);
    out = finalizeNote({ kind: "midi", input, midi, stepFinalis });
  }

  // Object with {chroma, octave}
  if (input && typeof input === "object") {
    const { chroma, octave } = input;
    const c = Number(chroma);
    const o = typeof octave === "number" ? octave : defaultOctave;
    const midi = toMidi(c, o);
    out = finalizeNote({
      kind: "object",
      input,
      chroma: c,
      octave: o,
      midi,
      stepFinalis,
    });
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
        out = finalizeNote({
          kind: "name",
          input,
          chroma,
          octave,
          midi,
          stepFinalis,
        });
        // continue to unified exit
      }
    }

    // Solfege like do4, RE, mib3, sol#5
    const mSol = /^([a-zA-Z]+)([#b♯♭]?)(-?\d+)?$/.exec(s);
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
        out = finalizeNote({
          kind: "solfege",
          input,
          chroma,
          octave,
          midi,
          solfege: syl,
          stepFinalis,
        });
        // continue to unified exit
      }
    }
  }
  // Unified exit: attach pitch bend once if applicable
  if (out) {
    if (
      ctx.bendRange > 0 &&
      typeof out.chroma === "number" &&
      typeof out.midi === "number"
    ) {
      const rawOpts = (typeof opts === "object" && opts) || {};
      out.pitchBend = computePitchBend(out.chroma, out.midi, rawOpts);
    }
    return out;
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

function medievalIntervalInfo(semitones, semitonesMod12) {
  if (typeof semitones !== "number" || typeof semitonesMod12 !== "number")
    return undefined;
  const absSemi = Math.abs(semitones);
  const mod = ((Math.abs(semitonesMod12) % 12) + 12) % 12;
  const octaves = Math.floor(absSemi / 12);
  const compound = absSemi >= 12;

  const base = INTERVAL[mod] || {};
  let { latin, alias, degree, quality } = base;

  // Special-case: true unison vs generic octave class
  if (mod === 0 && absSemi === 0) {
    latin = "Unisonus";
    alias = undefined;
    degree = 1;
    quality = "perfect";
  }

  return { latin, alias, degree, quality, compound, octaves };
}

/**
 * Compare two notes and describe the interval between them.
 * Accepts any inputs that `note()` accepts, or pre-normalized note objects.
 * Options: same as `note()` for context (mode/finalis/transpose/scale/scaleOptions).
 */
function interval(a, b, opts = {}) {
  const A = a && typeof a === "object" && "kind" in a ? a : note(a, opts);
  const B = b && typeof b === "object" && "kind" in b ? b : note(b, opts);

  const ctx = resolveContext(opts);

  const haveMidi = typeof A.midi === "number" && typeof B.midi === "number";
  const haveChroma =
    typeof A.chroma === "number" && typeof B.chroma === "number";
  const haveOct = typeof A.octave === "number" && typeof B.octave === "number";

  let semitones;
  if (haveMidi) {
    semitones = B.midi - A.midi;
  } else if (haveChroma && haveOct) {
    semitones = (B.octave - A.octave) * 12 + (B.chroma - A.chroma);
  }

  const chromaDiff = haveChroma
    ? (((B.chroma - A.chroma) % 12) + 12) % 12
    : undefined;
  const semitonesMod12 = haveChroma
    ? chromaDiff
    : typeof semitones === "number"
    ? ((semitones % 12) + 12) % 12
    : undefined;
  const etCents = typeof semitones === "number" ? semitones * 100 : undefined;

  // Tempered cents using scale and finalis context
  let temperedCents, deviationCents, temperedCentsMod12;
  if (haveChroma) {
    const offA = getCentsOffset(A.chroma, ctx);
    const offB = getCentsOffset(B.chroma, ctx);
    if (Number.isFinite(offA) && Number.isFinite(offB)) {
      if (typeof semitones === "number") {
        temperedCents = semitones * 100 + (offB - offA);
        deviationCents = temperedCents - semitones * 100;
      }
      if (typeof semitonesMod12 === "number") {
        const base = semitonesMod12 * 100 + (offB - offA);
        temperedCentsMod12 = ((base % 1200) + 1200) % 1200;
      }
    }
  }

  // Simple interval class names by semitones modulo 12
  const cls =
    typeof semitonesMod12 === "number"
      ? INTERVAL[semitonesMod12].class
      : undefined;
  const medieval =
    typeof semitones === "number" && typeof semitonesMod12 === "number"
      ? medievalIntervalInfo(semitones, semitonesMod12)
      : undefined;

  // Fallback to ET values if temperament offsets unavailable
  if (typeof temperedCents !== "number" && typeof etCents === "number") {
    temperedCents = etCents;
    temperedCentsMod12 =
      typeof semitonesMod12 === "number" ? semitonesMod12 * 100 : undefined;
    deviationCents = 0;
  }

  return {
    from: A,
    to: B,
    class: cls,
    cents: temperedCents,
    deviationCents,
    medieval,
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
    const sc = getScale(opts?.scale || "just", opts.scaleOptions || {});
    let ratios = Array.isArray(sc?.ratios) ? sc.ratios.slice() : [];
    if (ratios.length < 12) {
      console.error(`scale ${opts.scale} is not valid`);
      return null;
    }
    if (ratios.length > 12) ratios = ratios.slice(0, 12);
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

  /** Parse/annotate a note using this Temper's context (mode, transpose, scale). */
  note(input, opts = {}) {
    const merged = {
      // Context defaults from this Temper (let resolveFinalis derive finalis from mode+transpose)
      mode: this.meta?.mode,
      authentic: this.meta?.authentic,
      transpose: this.meta?.transpose | 0,
      scale: this.meta?.scale,
      // Allow call-site overrides
      ...opts,
    };
    const base = note(input, merged);
    const stepFinalis = resolveFinalis(merged);
    const transposed = transposeOutput(
      base,
      merged.transpose | 0,
      stepFinalis,
      merged
    );
    // Build frequency using ET anchor LA4 with temperament offset (no redundant details)
    if (typeof transposed.midi === "number") {
      const LA4 = this.meta?.LA4 || 440;
      const etFreq = LA4 * 2 ** ((transposed.midi - 69) / 12);
      const off =
        getCentsOffset(transposed.chroma, resolveContext(merged)) || 0;
      transposed.frequency = etFreq * 2 ** (off / 1200);
    }
    // Simplify pitchBend info, keep only bytes and declared range (for tests/consumers)
    if (transposed.pitchBend) {
      const { msb, lsb, value14, range } = transposed.pitchBend;
      transposed.pitchBend = { value14, msb, lsb, range };
    }
    // Collapse hand to ID only if present
    if (transposed.hand && transposed.hand.id)
      transposed.hand = transposed.hand.id;
    // Move provenance into meta
    transposed.meta = {
      input: base.input,
      mode: this.meta?.mode,
      scale: this.meta?.scale,
      transpose: this.meta?.transpose | 0,
    };
    // Remove top-level kind and input for cleaner shape
    delete transposed.kind;
    delete transposed.input;
    return transposed;
  }

  // Back-compat alias
  nota(input, opts = {}) {
    return this.note(input, opts);
  }

  /** Describe the interval between two notes using this Temper's context. */
  interval(a, b, opts = {}) {
    const merged = {
      // Let finalis be derived from mode+transpose
      mode: this.meta?.mode,
      authentic: this.meta?.authentic,
      transpose: this.meta?.transpose | 0,
      scale: this.meta?.scale,
      ...opts,
    };
    return interval(a, b, merged);
  }
}
// Default singleton instance with defaults
const defaultTemper = new Temper({});

// Factory to create custom instances without exposing the class
export function temper(opts = {}) {
  return new Temper(opts);
}

export default defaultTemper;
