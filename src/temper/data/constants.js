// Shared temper constants

export const STEPS = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1];

export const PITCH_CLASS = [
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

export const NAME_TO_CHROMA = new Map([
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

export const SOLFEGE_TO_CHROMA = new Map([
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
export const CHROMA_TO_SOLFEGE_BASE = new Map([
  [0, "UT"],
  [2, "RE"],
  [4, "MI"],
  [5, "FA"],
  [7, "SOL"],
  [9, "LA"],
  [10, "TE"],
  [11, "TI"],
]);

// Interval class labels by semitone distance modulo 12
export const INTERVAL_CLASS_12 = [
  "P1",
  "m2",
  "M2",
  "m3",
  "M3",
  "P4",
  "TT",
  "P5",
  "m6",
  "M6",
  "m7",
  "M7",
];
