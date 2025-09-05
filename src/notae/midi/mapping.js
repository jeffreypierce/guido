// src/midi/mapping.js — ESM microtuning helpers
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export function midiFloatFromFreq(freq, { refA = 440 } = {}) {
  if (!isFinite(freq) || freq <= 0) throw new Error('midiFloatFromFreq: bad freq');
  return 69 + 12 * Math.log2(freq / refA);
}
export function mapFreqToMidi(freq, { refA = 440, bendRange = 2 } = {}) {
  const m = midiFloatFromFreq(freq, { refA });
  const note = Math.round(m);
  const fractionalSemis = m - note;
  const span = Math.max(1e-6, bendRange);
  const norm = fractionalSemis / span;
  const bend = clamp(Math.round(8192 + norm * 8192), 0, 16383);
  const cents = fractionalSemis * 100;
  return { note, bend, cents, midiFloat: m };
}
export function freqFromMidi(note, bend = 8192, { refA = 440, bendRange = 2 } = {}) {
  const norm = clamp((bend - 8192) / 8192, -1, 1);
  const fractionalSemis = norm * Math.max(1e-6, bendRange);
  const m = note + fractionalSemis;
  const freq = refA * 2 ** ((m - 69) / 12);
  return { freq, midiFloat: m };
}
export function midiNumberFromFreq(freq, opts) {
  return Math.round(midiFloatFromFreq(freq, opts));
}
export function bendFromFreq(freq, note, { refA = 440, bendRange = 2 } = {}) {
  const m = midiFloatFromFreq(freq, { refA });
  const fractionalSemis = m - note;
  const span = Math.max(1e-6, bendRange);
  const bend = clamp(Math.round(8192 + (fractionalSemis / span) * 8192), 0, 16383);
  return bend;
}
export default {
  midiFloatFromFreq,
  mapFreqToMidi,
  freqFromMidi,
  midiNumberFromFreq,
  bendFromFreq,
};