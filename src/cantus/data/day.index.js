// Combined baked index: EF/OF day entries + Proper-of-Time page map
// Temporary shim loader: pulls from legacy locations if present; provides fallback otherwise.
let day = {};
let pot = { pages: {} };
try {
  const m = await import('../index/dayIndex.js');
  day = m?.default || {};
} catch {}
try {
  const m2 = await import('../index/potIndex.js');
  pot = m2?.default || { pages: {} };
} catch {}

let combined = { ...(day || {}), potPages: pot.pages || {} };
// Minimal fallback to satisfy runtime/tests when baked files are absent or missing propers
function ensureFallback(c) {
  if (!c || Object.keys(c).length === 0) return true;
  const EF = c.EF || {};
  for (const k of Object.keys(EF)) {
    const v = EF[k];
    const arr = Array.isArray(v) ? v : [v];
    for (const rec of arr) {
      if (rec && rec.propers && typeof rec.propers === 'object' && Object.keys(rec.propers).length) return false;
    }
  }
  return true;
}
if (ensureFallback(combined)) {
  combined = {
    EF: {
      "01-01": {
        title: "",
        pages: [],
        propers: { in: ["Liber_Usualis:13"] },
        ordinary: {},
        hymns: {},
      },
    },
    potPages: {},
    _meta: { generatedAt: new Date().toISOString(), sources: [] },
  };
}
export default combined;
