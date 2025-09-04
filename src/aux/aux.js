/** Shared, dependency-free helpers. Keep tiny & pure. */

/**
 * Clamp a number to the [0, 1] range.
 * @param {number} n
 * @returns {number}
 */
export const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Stable stringify for snapshot tests (sorts top-level keys).
 * @param {object} o
 * @returns {string}
 */
export const stableJson = (o) => JSON.stringify(o, Object.keys(o).sort(), 0);

/**
 * Normalize a Date-like value to a UTC-midnight Date.
 * @param {Date|string|number} x
 * @returns {Date}
 */
export function toUTC(x) {
  const d = x instanceof Date ? x : new Date(x);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}
