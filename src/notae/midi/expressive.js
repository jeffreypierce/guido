// src/midi/expressive.js
export function prosody(cantus, intonation = [], opts = {}) {
  const out = [];
  let ai = 0;
  let lastWasDivisio = true;
  let noteIndexInPhrase = 0;
  for (let i = 0; i < cantus.length; i++) {
    const c = cantus[i];
    const isRest = !c || typeof c.step !== 'number' ;
    if (isRest) {
      if (c && (c.divisio === '::' || c.divisio === ';' || c.divisio === ':')) {
        const L = out.length;
        if (L >= 1) out[L-1].velocity = Math.max(40, (out[L-1].velocity||70) - 6);
        if (L >= 2) out[L-2].velocity = Math.max(40, (out[L-2].velocity||70) - 3);
      }
      lastWasDivisio = true;
      noteIndexInPhrase = 0;
      continue;
    }
    const base = intonation[ai++] || {};
    const durationUnits = (c.duration != null) ? c.duration : 1;
    let v = 70;
    if (noteIndexInPhrase === 0) v += 8;
    else if (noteIndexInPhrase === 1) v += 4;
    v -= Math.min(6, Math.floor(noteIndexInPhrase / 3));

    if (opts && opts.tenorBias && typeof c.step === 'number') {
      const pc = ((c.step % 12) + 12) % 12;
      const tpc = opts.tenorBias.pc|0;
      const dist = Math.min((pc - tpc + 12) % 12, (tpc - pc + 12) % 12);
      if (dist === 0) v += opts.tenorBias.weight || 3;
      else if (dist === 1) v += Math.floor((opts.tenorBias.weight || 3) / 2);
    }

    if (v < 40) v = 40; if (v > 110) v = 110;
    const predelay = lastWasDivisio ? 0.1 : 0;

    out.push({ freq: base.freq, durationUnits, velocity: v, predelay });
    lastWasDivisio = false;
    noteIndexInPhrase++;
  }
  return out;
}
