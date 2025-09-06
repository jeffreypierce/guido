import { resolveProsody } from "./prosody/presets.js";

export function prosody(
  events,
  intonation,
  { prosody: preset, modeTenorPc } = {}
) {
  const P = resolveProsody(preset);
  const out = new Array(events.length);
  const isPhraseStart = (i) =>
    i === 0 || (events[i - 1] && events[i - 1].type === "rest");

  const arsis = events.map((ev, i) => {
    if (ev.type === "rest") return 0;
    let a = typeof ev.arsis === "number" ? ev.arsis : 1;
    const ino = intonation?.[i];
    if (ino && typeof ino.oct === "number") a += 0.1 * (ino.oct - 4);
    return Math.max(0, a);
  });

  const normPhrase = (start, end) => {
    let min = Infinity,
      max = -Infinity;
    for (let k = start; k < end; k++) {
      if (events[k].type !== "note") continue;
      if (arsis[k] < min) min = arsis[k];
      if (arsis[k] > max) max = arsis[k];
    }
    const span = max - min || 1;
    const v = [];
    for (let k = start; k < end; k++) {
      if (events[k].type !== "note") {
        v[k - start] = 0;
        continue;
      }
      v[k - start] = (arsis[k] - min) / span;
    }
    return v;
  };

  let i = 0;
  while (i < events.length) {
    let j = i + 1;
    while (j < events.length && events[j - 1].type !== "rest") j++;
    const norm = normPhrase(i, j);

    for (let k = i; k < j; k++) {
      const ev = events[k];
      if (ev.type === "rest") {
        out[k] = { velocity: 0, predelay: 0, durationScale: 1 };
        continue;
      }
      const idx = k - i;
      let v = norm[idx];

      const t = (idx + 0.5) / (j - i + 0.0001);
      const arch = 0.5 - 0.5 * Math.cos(2 * Math.PI * t);
      v = v * (1 - P.phraseCurveStrength) + arch * P.phraseCurveStrength;

      v *= P.accentToVelocityFactor;

      const ino = intonation?.[k];
      if (
        ino &&
        typeof modeTenorPc === "number" &&
        typeof ino.pc === "number"
      ) {
        const dist = Math.min(
          (12 + ino.pc - modeTenorPc) % 12,
          (12 + modeTenorPc - ino.pc) % 12
        );
        const tenorPull = Math.max(0, 1 - dist / 6);
        v = v * (1 + P.tenorBias.factor * 0.05 * tenorPull);
      }

      const next = events[k + 1];
      if (next && next.type === "rest" && typeof next.divisio === "string") {
        const strength = next.divisio.includes("::")
          ? 1.0
          : next.divisio.includes(":") || next.divisio.includes(";")
          ? 0.7
          : next.divisio.includes(",")
          ? 0.4
          : 0.0;
        v *= 1 - P.cadenceSoftening * strength * 0.5;
      }

      const pred = isPhraseStart(k) ? P.predelay : 0;
      out[k] = { velocity: v, predelay: pred, durationScale: 1 };
    }
    i = j;
  }
  return out;
}
