# DailyNews Domain Module

Pure schema, loading, labels, and deterministic editorial gates for news data. This
module must not import UI, Next.js, workflows, or infrastructure code.

| File | Responsibility |
| --- | --- |
| `README.md` | Module boundary and file index |
| `schema.ts` | Backward-compatible envelope plus v3 item, audience, pass, and audit contracts |
| `data.ts` | Static envelope loading and archive access |
| `labels.ts` | Reader-facing labels and freshness helpers |
| `rules.ts` | Core evidence, safety, lifecycle, chronology, and minimum-output gates |
| `rules.test.ts` | Core and v3 policy integration/adversarial regressions |
| `editorial-policy.ts` | v3 composition, score/time tiers, identity, research, and selection reconciliation |
| `editorial-policy.test.ts` | Focused v3 headline, opaque-safety-ledger, and legacy regressions |

Policy `v3-domestic-majority` publishes every permitted chosen-tier qualifier up
to 10, with at least 75% domestic stories and no international minimum. Three is
only the availability floor. An exactly-three result requires a reconciled
30-candidate first pass plus a 15-candidate second pass that introduces a new
source scope. International stories must show direct China-public impact or
global-systemic significance; routine foreign-local stories are never filler.
