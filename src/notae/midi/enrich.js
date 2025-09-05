// src/midi/enrich.js
import { prosody } from './expressive.js';
import { freqToMidiAndBend } from './mapping.js';

export function enrichWithMidi(events, temperFn, {
  refA = 440,
  bendRange = 2,
  includeVelocity = true,
  includePreDelay = true,
  tenorPc = null
} = {}) {
  const parsedNotes = events.map(e => e.type === 'note'
    ? { step: e.step, duration: e.duration }
    : { step: null, duration: e.duration, divisio: e.divisio });

  let intonation = temperFn(parsedNotes) || [];
  const shaped = prosody(parsedNotes, intonation, { tenorBias: (tenorPc==null?null:{ pc: tenorPc, weight: 3 }) });

  const out = events.map(e => ({ ...e }));
  let k = 0;
  for (let i = 0; i < out.length; i++) {
    const e = out[i];
    if (e.type !== 'note') continue;
    const a = shaped[k++] || {};
    if (a.freq != null) {
      e.freq = a.freq;
      const { note, bend } = freqToMidiAndBend(e.freq, { refA, bendRange });
      e.midiNote = note;
      e.pitchBend = bend;
    }
    if (includeVelocity && a.velocity != null) e.velocity = a.velocity;
    if (includePreDelay && a.predelay != null) e.preDelay = a.predelay;
  }
  return out;
}
