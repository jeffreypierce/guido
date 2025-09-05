// src/midi/writer.js
const enc = new TextEncoder();

const DEFAULTS = { ppq: 480, tempoBPM: 90, bendRange: 2, channel: 0, program: 52 };

const u8 = (n) => Uint8Array.of(n & 0xff);
const u16 = (n) => Uint8Array.of((n>>8)&0xff, n&0xff);
const u32 = (n) => Uint8Array.of((n>>24)&0xff, (n>>16)&0xff, (n>>8)&0xff, n&0xff);
const str4 = (s) => enc.encode(s);

function vlq(n) { const bytes = []; do { bytes.unshift(n & 0x7f); n >>= 7; } while (n > 0);
  for (let i=0;i<bytes.length-1;i++) bytes[i] |= 0x80; return Uint8Array.from(bytes); }
function concat(...arrs) { const len = arrs.reduce((a,b)=>a+b.length,0); const out = new Uint8Array(len); let o=0;
  for (const a of arrs) { out.set(a,o); o+=a.length; } return out; }
function metaTempo(bpm){ const mpqn = Math.round(60000000 / bpm); return concat(u8(0x00), u8(0xff), u8(0x51), u8(0x03), u8((mpqn>>16)&0xff), u8((mpqn>>8)&0xff), u8(mpqn&0xff)); }
function metaEOT(){ return concat(u8(0x00), u8(0xff), u8(0x2f), u8(0x00)); }
function ch(st,...d){ return Uint8Array.of(st, ...d); }
function noteOn(chNo,n,v){ return ch(0x90|(chNo&0x0f), n&0x7f, v&0x7f); }
function noteOff(chNo,n,v=64){ return ch(0x80|(chNo&0x0f), n&0x7f, v&0x7f); }
function cc(chNo,c,v){ return ch(0xB0|(chNo&0x0f), c&0x7f, v&0x7f); }
function pb(chNo,val14){ const lsb = val14 & 0x7f; const msb=(val14>>7)&0x7f; return ch(0xE0|(chNo&0x0f), lsb, msb); }
function pc(chNo,p){ return ch(0xC0|(chNo&0x0f), p&0x7f); }

export function buildMidi(events, opts = {}) {
  const { ppq, tempoBPM, bendRange, channel, program } = { ...DEFAULTS, ...opts };
  const ticksPerUnit = ppq * 1;

  const track = [];
  track.push(metaTempo(tempoBPM));
  track.push(concat(u8(0x00), pc(channel, program)));
  // RPN 0,0 and data entry bend range
  track.push(concat(u8(0x00), cc(channel, 101, 0)));
  track.push(concat(u8(0x00), cc(channel, 100, 0)));
  track.push(concat(u8(0x00), cc(channel, 6, bendRange)));
  track.push(concat(u8(0x00), cc(channel, 38, 0)));
  track.push(concat(u8(0x00), cc(channel, 101, 127)));
  track.push(concat(u8(0x00), cc(channel, 100, 127)));

  let delta = 0;
  for (const e of events) {
    if (e.type !== 'note') { delta += Math.round((e.duration || 0) * ticksPerUnit); continue; }
    const pre = Math.round((e.preDelay || 0) * ticksPerUnit);
    delta += pre;
    if (typeof e.pitchBend === 'number') { track.push(concat(vlq(delta), pb(channel, Math.max(0, Math.min(16383, e.pitchBend))))); delta = 0; }
    const vel = Math.max(1, Math.min(127, Math.round(e.velocity || 80)));
    track.push(concat(vlq(delta), noteOn(channel, e.midiNote & 0x7f, vel)));
    delta = Math.round((e.duration || 1) * ticksPerUnit);
    track.push(concat(vlq(delta), noteOff(channel, e.midiNote & 0x7f, 64)));
    delta = 0;
  }
  track.push(metaEOT());

  const trkData = track.reduce((a,b)=>concat(a,b), new Uint8Array());
  const hdr = concat(str4("MThd"), u32(6), u16(0), u16(1), u16(ppq));
  const trk = concat(str4("MTrk"), u32(trkData.length), trkData);
  return concat(hdr, trk);
}
