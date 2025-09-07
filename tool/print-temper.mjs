import Temper, { temper } from '../src/temper/index.js';

function show(label, obj) {
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(obj, null, 2));
}

const T = temper({ mode: 'VII', scale: 'pythagorean' });
const T2 = temper({ mode: 'VII', transpose: 2, scale: 'pythagorean' });

show('T.note("G4", { bendRange: 2 })', T.note('G4', { bendRange: 2 }));
show('T2.note("G4", { bendRange: 2 })', T2.note('G4', { bendRange: 2 }));
show('Temper.note("Bb3")', Temper.note('Bb3'));
show('Temper.interval("C4", "G4", { scale: "pythagorean" })', Temper.interval('C4','G4', { scale: 'pythagorean' }));
