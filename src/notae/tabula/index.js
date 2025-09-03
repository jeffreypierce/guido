//
/**
 * @typedef {Object} Celebration
 * @property {string} feastId
 * @property {string} title
 * @property {string} rank
 * @property {string} season
 */

/**
 * Return celebration details for the given date.
 * @param {Date|string|number} date
 * @param {{ form?: "1962"|"1974" }} [options]
 * @returns {Celebration}
 */
export function festum(_date, _options = {}) {
  // TODO: implement (Step 3)
  return { feastId: "feria", title: "Feria", rank: "Feria", season: "pt" };
}
