// src/constants.js
export const STEPS = Object.freeze([1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1]);

export const SOLFEGE = Object.freeze([
  "UT",
  "UI",
  "RE",
  "ME",
  "MI",
  "FA",
  "FU",
  "SOL",
  "LE",
  "LA",
  "TE",
  "TI",
]);

export const CLEFS = new Map([
  ["c1", -3],
  ["c2", -1],
  ["c3", 1],
  ["c4", 3],
  ["f1", 1],
  ["f2", 3],
  ["f3", 5],
  ["f4", 7],
  ["cb1", -3],
  ["cb2", -1],
  ["cb3", 1],
  ["cb4", 3],
]);

export const DIVISIONES = new Map([
  [",", 0.5],
  ["`", 0.25],
  [";", 1],
  [":", 1],
  ["::", 2],
]);

export const PITCH_CLASS = Object.freeze([
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
]);
export const SOLFEGE_CHROMATIC = Object.freeze([
  "UT",
  "UI",
  "RE",
  "ME",
  "MI",
  "FA",
  "FU",
  "SOL",
  "LE",
  "LA",
  "TE",
  "TI",
]);
