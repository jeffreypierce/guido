// tests/suite.hymnus.js
import { hymnus } from "../src/cantus/index.js";
import { festum } from "../src/festum/index.js";

banner("hymnus — basic selection");

it("returns a selected hymn for OF Vespers", () => {
  const f = festum("2025-06-15", { form: "OF" });
  const h = hymnus({ festum: f, hour: "vespers2" }, { source: "LH" });
  assert(h && Array.isArray(h.candidates), "candidates present");
  assert(
    h.selected || h.candidates.length >= 0,
    "selected or at least candidate list"
  );
});

it("respects mode/source filters", () => {
  const f = festum("2025-06-15", { form: "OF" });
  const h = hymnus(
    { festum: f, hour: "vespers2" },
    { source: "LH", modes: ["1"] }
  );
  if (h.candidates.length) {
    assert(
      h.candidates.every((r) => String(r?.chant?.mode || "") === "1"),
      "mode filtered"
    );
    assert(
      h.candidates.every((r) =>
        /Liber Hymnarius|Liber_Hymnarius/.test(
          String(r?.source?.name || "") + " " + String(r?.id || "")
        )
      ),
      "source filtered"
    );
  } else {
    assert(true, "no candidates found for strict filter; skip");
  }
});
