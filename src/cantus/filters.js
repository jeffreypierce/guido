// src/cantus/filters.js — shared normalization for selection/search inputs

import { norm } from "../aux/index.js";

// Public-friendly aliases for sources used across modules
export const SOURCE_ALIASES = new Map([
  ["GR", "Graduale Romanum"],
  ["GR1974", "Graduale Romanum 1974"],
  ["GR74", "Graduale Romanum 1974"],
  ["LU", "Liber Usualis"],
  ["LH", "Liber Hymnarius"],
  ["AM", "Antiphonale Monasticum"],
]);

export function toArray(x) {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

/** Normalize selection/search inputs consistently across modules. */
export function normalizeSelectionInputs(opts = {}, defaults = {}) {
  const offices = toArray(opts.offices ?? defaults.offices)
    .map((s) => String(s).toLowerCase())
    .filter(Boolean);
  const modes = toArray(opts.modes ?? defaults.modes)
    .map((m) => String(m))
    .filter(Boolean);
  const source = toArray(opts.source ?? defaults.source).filter(Boolean);
  const incipitRaw = opts.incipit ?? defaults.incipit ?? null;
  const incipit =
    incipitRaw != null && String(incipitRaw).trim() ? String(incipitRaw) : null;
  return { offices, modes, source, incipit };
}

/** Build a normalized needle list for matching sources by name or id. */
export function buildSourceNeedle(sourceList = []) {
  const srcs = toArray(sourceList);
  return srcs.flatMap((s) => {
    const key = String(s).toUpperCase();
    const alias = SOURCE_ALIASES.get(key);
    return alias ? [norm(alias), norm(String(s))] : [norm(String(s))];
  });
}

/**
 * Filter or rank a list by chant mode with a shared policy.
 * items: array of rows or ids; getMode extracts a mode string.
 * policy:
 *  - 'strict': keep only matching modes
 *  - 'fallback': prefer matching; if none, return original list
 *  - 'prefer': keep all; put matching modes first
 */
export function filterByMode(items, modesInput) {
  const arr = Array.isArray(items) ? items.slice() : [];
  const modes = new Set((modesInput || []).map(String).filter(Boolean));
  if (!arr.length || modes.size === 0) return arr;
  const gm = (r) => (r?.chant?.mode != null ? String(r.chant.mode) : "");
  const matches = arr.filter((r) => modes.has(gm(r)));
  return matches;
}
