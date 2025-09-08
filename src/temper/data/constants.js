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
export const CHROMA_TO_SOLFEGE = new Map([
  [0, "UT"],
  [2, "RE"],
  [4, "MI"],
  [5, "FA"],
  [7, "SOL"],
  [9, "LA"],
  [10, "TE"],
  [11, "TI"],
]);

export const INTERVAL = [
  // 0..11 (mod 12)
  {
    latin: "Octava",
    alias: "Diapason",
    degree: 8,
    quality: "perfect",
    class: "P1",
  }, // 0 (overridden to Unisonus when absSemi === 0)
  { latin: "Semitonium", degree: 2, quality: "minor", class: "m2" }, // 1
  { latin: "Tonus", degree: 2, quality: "major", class: "M2" }, // 2
  { latin: "Tertia minor", degree: 3, quality: "minor", class: "m3" }, // 3
  { latin: "Tertia maior", degree: 3, quality: "major", class: "M3" }, // 4
  {
    latin: "Quarta",
    alias: "Diatessaron",
    degree: 4,
    quality: "perfect",
    class: "P4",
  }, // 5
  { latin: "Tritonus", degree: 4, quality: "augmented", class: "TT" }, // 6
  {
    latin: "Quinta",
    alias: "Diapente",
    degree: 5,
    quality: "perfect",
    class: "P5",
  }, // 7
  { latin: "Sexta minor", degree: 6, quality: "minor", class: "m6" }, // 8
  { latin: "Sexta maior", degree: 6, quality: "major", class: "M6" }, // 9
  { latin: "Septima minor", degree: 7, quality: "minor", class: "m7" }, // 10
  { latin: "Septima maior", degree: 7, quality: "major", class: "M7" }, // 11
];
