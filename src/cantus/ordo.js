// src/cantus/ordo.js — selects best candidates and assembles traditional order

import { proprium } from './proprium.js';
import ordinarium from './ordinarium.js';

/**
 * Build a simple ordo for a celebration.
 * Uses only `ctx.festum` and `ctx.forma` to decide penitential behavior and ordering.
 * Does not select specific chants; leaves room for higher-level modules to fill in.
 *
 * @param {{ festum: { season: string, weekday: 'dominica'|'feria' }, forma?: '1962'|'1974' }} ctx
 * @param {{}} [opts]
 * @returns {{ mass_label?: string, ordinary: Array<{kind:'ordinary', office:string}>, propers: Array<{kind:'proper', office:string}>, sequence: Array<{kind:'ordinary'|'proper', office:string}> }}
 */
export function ordo(ctx, opts = {}) {
  const fest = ctx?.festum || {};
  const forma = ctx?.forma || "1962";

  // Select ordinary and propers
  const ord = ordinarium(
    { festum: fest },
    {
      lenientSelection: !!opts.lenientSelection,
      bvmHeuristic: !!opts.bvmHeuristic,
      modes: opts.modes || [],
      source: opts.source || undefined,
    }
  );
  const prop = proprium(
    { festum: fest },
    { modes: opts.modes || [], source: opts.source || undefined }
  );

  const gloria = !!ord.gloria;
  const credo = !!ord.credo;
  const isFeria = fest.weekday === "feria";
  const penitential = forma === "1962" && (fest.season === "sg" || fest.season === "lt");

  // Helpers to pick one of each
  const pickOrd = (code) => {
    const ids = ord?.parts?.[code];
    return Array.isArray(ids) && ids.length ? String(ids[0]) : undefined;
  };
  const pickProp = (office) => {
    const it = (prop || []).find((x) => x.office === office);
    return it && it.selected ? String(it.selected.id) : undefined;
  };

  const blocks = [];
  // Introit
  const inId = pickProp("in");
  if (inId) blocks.push({ kind: "proper", office: "in", id: inId });
  // Kyrie
  const kyId = pickOrd("ky");
  if (kyId) blocks.push({ kind: "ordinary", office: "ky", id: kyId });
  // Gloria (if not penitential and default true)
  if (!penitential && gloria) {
    const glId = pickOrd("gl");
    if (glId) blocks.push({ kind: "ordinary", office: "gl", id: glId });
  }
  // Gradual
  const grId = pickProp("gr");
  if (grId) blocks.push({ kind: "proper", office: "gr", id: grId });
  // Alleluia or Tract
  const alt = penitential ? "tr" : "al";
  const altId = pickProp(alt);
  if (altId) blocks.push({ kind: "proper", office: alt, id: altId });
  // Sequence (if any)
  const seId = pickProp("se");
  if (seId) blocks.push({ kind: "proper", office: "se", id: seId });
  // Credo (if used)
  if (credo) {
    const crId = pickOrd("cr");
    if (crId) blocks.push({ kind: "ordinary", office: "cr", id: crId });
  }
  // Offertory
  const ofId = pickProp("of");
  if (ofId) blocks.push({ kind: "proper", office: "of", id: ofId });
  // Sanctus
  const saId = pickOrd("sa");
  if (saId) blocks.push({ kind: "ordinary", office: "sa", id: saId });
  // Agnus
  const agId = pickOrd("ag");
  if (agId) blocks.push({ kind: "ordinary", office: "ag", id: agId });
  // Communion
  const coId = pickProp("co");
  if (coId) blocks.push({ kind: "proper", office: "co", id: coId });
  // Dismissal: Ite (Sunday) or Benedicamus (feria)
  const dismiss = isFeria ? "be" : "it";
  const disId = pickOrd(dismiss);
  if (disId) blocks.push({ kind: "ordinary", office: dismiss, id: disId });

  const ordinary = blocks.filter((x) => x.kind === "ordinary");
  const propers = blocks.filter((x) => x.kind === "proper");
  const mass_label = ord?.selected?.roman;

  return { mass_label, sequence: blocks, ordinary, propers };
}

export default ordo;
