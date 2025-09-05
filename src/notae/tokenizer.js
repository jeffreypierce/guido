// src/gabc/tokenizer.js
export const syllablesRegex = /(?=.)((?:[^(])*)(?:\(?([^)]*)\)?)?/g;
export const notationsRegex = /z0|z|Z|::|:|[,;][1-6]?|`|[cf][1-4]|cb[1-4]|\/+| |\!|-?[a-mA-M][oOwWvVrRsxy#~\+><_\.'012345]*(?:\[[^\]]*\]?)*|\{([^}]+)\}?/g;

export const splitWords = (gabc) =>
  gabc.replace(/\)\s(?=[^\)]*(?:\(|$))/g, ")\n").split(/\n/g);
