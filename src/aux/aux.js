/** Shared, dependency-free helpers. Keep tiny & pure. */

/** Clamp to [0,1] */
export const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Stable stringify for snapshot tests */
export const stableJson = (o) => JSON.stringify(o, Object.keys(o).sort(), 0);
