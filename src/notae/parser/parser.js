// src/gabc/parser.js
import { CLEFS, DIVISIONES } from "../constants.js"; // Vowel & weights helpers
import { resolveRubrics } from "./rules.js";
const VOWELS_BASE = /[aeiouy]/i;
const VOWELS_ACCENTED = /[áéíóúýǽ]/i;

// Expand ligatures and preserve accent where possible (ǽ => áe)
function expandLigatures(str) {
  return (str || "")
    .replace(/ǽ/g, "áe")
    .replace(/æ/g, "ae")
    .replace(/œ/g, "oe");
}

/**
 * Pick a stable vowel for syllable analysis.
 * Returns { vowel: 'a|e|i|o|u|i', tictus: 0|1 }
 */
export function selectVowel(lyricRaw = "") {
  if (!lyricRaw) return { vowel: "", tictus: 0 };
  const raw = lyricRaw;
  const expanded = expandLigatures(raw);

  const candidates = [];
  for (let i = 0; i < expanded.length; i++) {
    const ch = expanded[i];
    if (VOWELS_BASE.test(ch)) {
      const origSlice = raw.slice(i, i + 2);
      const accented = VOWELS_ACCENTED.test(origSlice);
      candidates.push({ ch, i, accented });
    }
  }
  if (candidates.length === 0) return { vowel: "", tictus: 0 };
  const picked = candidates.find((c) => c.accented) || candidates[0];

  let vowel = picked.ch.toLowerCase();
  if (vowel === "y") vowel = "i";
  vowel = vowel.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const tictus = picked.accented ? 1 : 0;
  return { vowel, tictus };
}

export function parseGABC(gabc, { oct = 3, initialClef, weights } = {}) {
  let clavis = initialClef || "c3";
  const words = (gabc || "")
    .replace(/\)\s(?=[^\)]*(?:\(|$))/g, ")\n")
    .split(/\n/g)
    .map((line) =>
      parse_word(
        line,
        oct,
        () => clavis,
        (v) => {
          clavis = v;
        },
        resolveRubrics(weights)
      )
    )
    .map((w) => w.filter(Boolean))
    .filter((w) => w.length > 0);
  return { words, errors: [] };
}

function _legacyResolveRubrics(weights) {
  return {
    ictusFactor: 1,
    ictusDuration: 0.25,
    moraFactor: 0.5,
    moraDuration: 1,
    initioDebilisAttenuation: 2,
    punctumInclinatumAttenuation: 1,
    liquescentAttenuation: 0.5,
    pressusDuration: 0.5,
    pressusOffset: 1,
    oriscusAttenuation: 1,
  };
}

function parseWord(gabcWord, oct, getClef, setClef, weights) {
  const matches = [];
  let m;
  while ((m = syllablesRegex.exec(gabcWord))) matches.push(m);
  return matches
    .map((mm) => {
      const lyric = mm[1].trim().split("|");
      const notation = mm[2] ? mm[2].match(notationsRegex) : undefined;
      const part = parse_notation({
        lyric,
        notation,
        oct,
        getClef,
        setClef,
        weights,
      });
      return Array.isArray(part) ? part : [part];
    })
    .flat();
}

function parseNotation({ lyric, notation, oct, getClef, setClef, weights }) {
  if (!notation) return;
  const l = lyric[0] || "";

  // Helper to compute vowel/tictus once per syllable
  let vowel = (l.toLowerCase().match(/(i|[aeiouæœyáéíóúǽý])/i) || [""])[0];
  let tictus = 0;
  if (vowel) {
    tictus = vowel !== vowel.normalize("NFD") ? 1 : 0;
    vowel = vowel
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (vowel === "y") vowel = "i";
  }

  const out = [];
  let buf = [];

  const flushNeume = () => {
    if (buf.length === 0) return;
    const notes = parseNeume(buf, oct, tictus, getClef(), weights);
    out.push({ type: "neume", vowel, notes, lyric: l, notation: buf.join("") });
    buf = [];
  };

  for (const tok of notation) {
    if (CLEFS.has(tok)) {
      // clef change anywhere
      flushNeume();
      setClef(tok);
      continue;
    }
    if (DIVISIONES.has(tok)) {
      // end current neume, then emit divisio
      flushNeume();
      out.push({
        type: "diviso",
        divisio: tok,
        notes: [
          {
            step: null,
            arsis: 0,
            ictus: 0,
            duration: DIVISIONES.get(tok),
            vowel: "",
          },
        ],
      });
      continue;
    }
    if (
      tok === " " ||
      tok === "z" ||
      tok === "Z" ||
      tok === "z0" ||
      tok === "{" ||
      tok === "\r"
    )
      continue;
    if (tok.length > 1 && tok[1] === "+") continue; // custos

    // otherwise, accumulate note token
    buf.push(tok);
  }
  flushNeume();
  return out;
}
function parseNeume(neume, oct, tict, clavis, weights) {
  const baseBmolle = clavis.includes("b") ? 1 : 0;
  const notes = [];
  const breaks = [];

  for (let i = 0; i < neume.length; i++) {
    let raw = neume[i];
    if (["!", "/", "//"].includes(raw)) {
      breaks.push(i);
      continue;
    }

    // accidentals inside neume: x = flat (b-molle) for this note; y = natural for this note
    let effectiveBmolle = baseBmolle;
    if (raw.length > 1 && (raw[1] === "x" || raw[1] === "y")) {
      if (raw[1] === "x") effectiveBmolle = 1;
      if (raw[1] === "y") effectiveBmolle = 0;
    }

    let arsis = 5,
      ictus = 0,
      duration = 1;
    const prev = notes.length ? notes[notes.length - 1] : undefined;

    // initio debilis
    if (raw[0] === "-") {
      raw = raw.slice(1);
      arsis -= weights.initioDebilisAttenuation;
    }

    // pitch
    const clefOffset = CLEFS.get(clavis) || 0;
    const pos =
      raw[0].toLowerCase().charCodeAt(0) - "a".charCodeAt(0) - 6 - clefOffset;
    const steps = [0, 2, 4, 5, 7, 9, 11];
    let step = steps[(pos < 0 ? pos + 14 : pos) % 7];
    if (effectiveBmolle && step === 11) step = 10; // B -> Bb
    const octave = Math.floor(pos / 7) + oct + 1;
    step += octave * 12;

    // Rule 1: episemata
    if (raw.includes("'")) {
      arsis += weights.ictusFactor;
      ictus = 1;
      duration += weights.ictusDuration;
    }
    if (raw.includes("_")) {
      arsis += weights.ictusFactor;
      ictus = 1;
      duration += weights.ictusDuration;
    }

    // Rule 2: sustained notes
    if (raw.includes("..") || raw.includes(".")) {
      arsis += weights.moraFactor;
      duration += weights.moraDuration;
      ictus = 1;
    }
    if (raw.includes("ss") || raw.includes("vv")) {
      arsis += weights.moraFactor;
      ictus = 1;
      duration += weights.moraDuration;
      if (raw.includes("sss") || raw.includes("vvv"))
        duration += weights.moraDuration;
    }

    // quilisma prep
    if (raw.toLowerCase().includes("w")) {
      if (prev) prev.arsis += 1;
      arsis = Math.max(0, arsis - 0.5);
    }

    // Rule 3: group begins (and tictus)
    if (i === 0 || (tict && i === 2)) {
      arsis += 1;
      if (neume.length > 1) {
        ictus = 1;
        arsis += 0.5;
      }
    }

    // liquescent / punctum inclinatum
    if (raw.includes("~") || raw.includes("<") || raw.includes(">")) {
      arsis -= 0.5;
      duration -= 0.5;
    }
    if (raw[0] === raw[0].toUpperCase()) {
      arsis -= 1;
      duration -= 0.25;
    }

    // pressus & oriscus
    if (prev && step === prev.step) {
      prev.duration += weights.pressusDuration;
      prev.arsis += weights.pressusOffset;
      if (raw.includes("o")) prev.arsis -= 1;
    }

    arsis = Math.floor(arsis);
    notes.push({ step, arsis, duration, ictus });

    // double mora on first glyph also extends the first note
    if (raw.includes("..") && i === 0 && notes.length >= 1) {
      notes[0].duration += weights.moraDuration;
    }
  }

  // intra-neume accents after breaks
  breaks.forEach((b, bi) => {
    const idx = b - bi;
    const n = notes[idx];
    if (n) {
      n.arsis += 1;
      n.ictus = 1;
    }
  });
  return notes;
}

export const gabc = (gabc, oct = 3) => parseGABC(gabc, { oct }).words;
