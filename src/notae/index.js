//
/**
 * Parse GABC / chant input and return an object with output methods.
 * @param {any} chantsOrGabc
 * @param {{ prosody?: boolean, rubrics?: boolean, humanize?: boolean,
 *           Temper?: object }} [options]
 */
export function notae(_chantsOrGabc, _options = {}) {
  // Methods to be implemented in later steps
  return {
    midi: (_opts = {}) => {
      throw new Error("notae.midi: not implemented");
    },
    tabula: (_opts = {}) => {
      throw new Error("notae.tabula: not implemented");
    },
    schola: (_opts = {}) => {
      throw new Error("notae.schola: not implemented");
    },
    reliquum: (_opts = {}) => {
      throw new Error("notae.reliquum: not implemented");
    },
    verbum: (_opts = {}) => {
      throw new Error("notae.verbum: not implemented");
    },
  };
}
