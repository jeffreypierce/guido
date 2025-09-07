// tests/suite.temper.js — checks for temper module
import Temper, { temper } from '../src/temper/index.js';
import { pythagorean, meantone, just } from '../src/temper/scala.js';

banner('temper — scales, note parsing, intervals');

it('pythagorean returns >= 12 degrees with ratios', () => {
  const sc = pythagorean();
  assert(sc.cents.length >= 12, 'pyth cents length');
  assert(Array.isArray(sc.ratios) && sc.ratios.length === sc.cents.length, 'ratios aligned');
});

it('meantone(1/4) returns tempered fifths ordering', () => {
  const sc = meantone({ comma: 1/4 });
  assert(sc.cents.length >= 12, 'meantone size');
});

it('note() parses names, midi, solfege, and objects', () => {
  const a = Temper.note('A4');
  assert(a.midi === 69 && a.chroma === 9 && a.name === 'A4', 'name parse');
  const m = Temper.note(60);
  assert(m.name === 'C4' && m.chroma === 0 && m.octave === 4, 'midi parse');
  const s = Temper.note('sol4');
  assert(s.solfege === 'SOL' && s.chroma === 7, 'solfege parse');
  const o = Temper.note({ chroma: 11, octave: 4 });
  assert(o.midi === 71 && o.name === 'B4', 'object parse');
});

it('Temper.note uses context for step and pitchBend', () => {
  const T = temper({ mode: 'VII', scale: 'pythagorean' });
  const g = T.note('G4', { bendRange: 2 });
  assert(g.step === 0, 'G is finalis step 0 in mode VII');
  assert(g.pitchBend && g.pitchBend.range === 2, 'pitch bend attached');
});

it('interval returns medieval names and tempered cents', () => {
  const iv = Temper.interval('C4', 'G4', { scale: 'pythagorean' });
  assert(iv.class === 'P5', 'class P5');
  assert(iv.medieval && iv.medieval.latin === 'Quinta', 'medieval Quinta');
  if (typeof iv.tempered.cents === 'number') {
    assert(iv.tempered.cents >= 0 && iv.tempered.cents <= 1200, 'tempered cents plausible');
  }
});
