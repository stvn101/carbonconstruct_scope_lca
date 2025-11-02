# Fix Summary

## Files Changed
- **js/lca-calculator.js** (L40-L317): Added biogenic credit controls, separated biogenic storage from A1–A3 totals, and clamped B/C stages to prevent negative propagation while aggregating project-level storage per EN 16485 and ISO 14044 guidance.
- **js/main.js** (L7-L618): Stored per-material biogenic metadata, pivoted project totals and UI labelling to whole-life reporting, and preserved scope metadata when loading/creating projects to align with EN 15978 scope definitions.
- **js/compliance.js** (L127-L405): Passed scope-aware carbon totals into NCC/NABERS/Green Star checks and surfaced the reporting scope within results for transparent benchmarking.
- **js/storage.js** (L6-L331): Replaced REST fetch calls with Supabase client operations using environment credentials, persisted whole-life/embodied breakdowns, and updated exports to label scope clearly.
- **js/scopes-calculator.js** (L410-L449): Mapped Scope 3 materials using stored category/type metadata instead of string splitting in line with the GHG Protocol category taxonomy.

## References
- EN 16485:2014 – Wood products LCAs and biogenic carbon accounting.
- ISO 14044:2006 – Requirements and guidelines for life-cycle assessment.
- EN 15978:2011 – Assessment of the environmental performance of buildings (whole-life perspective).
- GHG Protocol Corporate Standard – Scope 3 Category 1 classification guidance.
