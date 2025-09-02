# Cantus v5 — Propers Lookups & Resolver

This directory wires the **propers lookups** to the **v5 corpus** where **Liber Usualis (LU)** is the **baseline**, and other books are **diffs** preserving `gabc` variants.

## Files

- `liber_usualis.json` — LU baseline (all chants).
- `graduale_romanum_1974.json` — GR 1974 items not in LU or with different `gabc`.
- `graduale_romanum.json` — GR 1961 items not in LU or with different `gabc`.
- `liber_hymnarius.json` — LH items not in LU or with different `gabc`.
- `aliases.json` — map of variant IDs → LU base IDs.
- `resolver.json` — precedence and lookup paths for 1962/1974.

## Lookups

<!-- For each regime there are **IDs-only** lookup files:

- `propers_1962/feasts.v5.min.json` — `feast_slug → { office → [ids] }`
- `propers_1962/commons.v5.min.json` — `category → { office → [ids] }`
- `propers_1974/feasts.v5.min.json`
- `propers_1974/commons.v5.min.json` -->

<!-- > Note: Lookups return IDs that may be LU or non-LU. Use the resolver logic to prefer LU when possible. -->

## Resolver (recommended pseudocode)

```ts
// given (regime, feastSlug, office)
const cfg = await loadJSON("resolver.json");
const lookups = await loadJSON(cfg.lookups[regime].feasts);
const commons = await loadJSON(cfg.lookups[regime].commons);
const aliases = await loadJSON(cfg.id_aliases);

function preferLU(ids: string[]): string[] {
  const seen = new Set<string>();
  const luFirst = [];
  for (const id of ids) {
    const preferred = aliases[id] ?? id; // map variant → LU base if present
    if (!seen.has(preferred)) {
      seen.add(preferred);
      luFirst.push(preferred);
    }
  }
  return luFirst;
}

function resolvePropers(
  regime: "1962" | "1974",
  feastSlug: string,
  office: string
): string[] {
  const hit = lookups[feastSlug]?.[office];
  if (hit?.length) return preferLU(hit);
  // no feast-specific -> app chooses office (al vs tr) via calendar; then
  const cat = detectCategoryFromFeastTitle(feastSlug); // your catMap
  const fallback = commons[cat]?.[office] ?? [];
  return preferLU(fallback);
}
```

## Notes

- Keep Alleluia/Tract selection in the **calendar logic**.
- LU is authoritative for shared chants; diffs preserve GABC variants from GR/GR1974/LH.
- The lookup files remain tiny and fast to load.
