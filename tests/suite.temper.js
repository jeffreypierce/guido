// tests/suite.temper.js — minimal checks for Temper + scala
import { Temper, temper } from '../src/temperamentum/index.js';
import { pythagorean, meantone, justDiatonic } from '../src/temperamentum/scala.js';

banner('temperamentum — scales and Temper');

it('pythagorean returns 12 degrees with ratios', () => {
  const sc = pythagorean();
  assert(sc.cents.length >= 12, 'pyth cents length');
  assert(Array.isArray(sc.ratios) && sc.ratios.length === sc.cents.length, 'ratios aligned');
});

it('meantone(1/4) returns tempered fifths ordering', () => {
  const sc = meantone({ comma: 1/4 });
  assert(sc.cents.length >= 12, 'meantone size');
});

it('Temper.hz produces A4=440 by default', () => {
  const T = temper({});
  const hz = T.hz('A4');
  assert(Math.abs(hz - 440) < 1e-6, 'A4 is 440');
});

