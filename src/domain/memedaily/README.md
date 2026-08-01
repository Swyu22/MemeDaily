# MemeDaily Domain Module

Pure schema, loading, labels, and deterministic editorial gates for meme data. This
module must not import UI, Next.js, workflows, or infrastructure code.

| File | Responsibility |
| --- | --- |
| `README.md` | Module boundary and file index |
| `schema.ts` | Backward-compatible JSON envelope, item, and v4 research-pass contracts |
| `data.ts` | Static envelope loading and archive access |
| `labels.ts` | Reader-facing labels and presentation-safe projections |
| `labels.test.ts` | Heat/freshness component sorting and historical fallback regressions |
| `rules.ts` | Core evidence, safety, lifecycle, and minimum-output gates |
| `rules.test.ts` | Core evidence, safety, lifecycle, and historical-policy regressions |
| `editorial-completeness.ts` | v4 research-pass reconciliation and exactly-three second-pass gate |
| `editorial-completeness.test.ts` | v4 second-pass depth and independent-source adversarial regressions |
| `dynamic-selection.ts` | Score, audit, tier, identity, recurrence, and v4 editorial-completeness gates |
| `dynamic-selection.test.ts` | Score, activity, identity, tier, recurrence, and research-pass regressions |

Policy `v4-editorial-completeness` requires a reconciled `editorial_complete=true`
declaration and structured research passes. The first pass covers at least 30 unique
candidates. If the chosen tier still has exactly three qualifiers, a second pass must
add at least 15 unique candidates, introduce a source scope absent from pass one, and
raise the cumulative, deduplicated audit to at least 45. The result may remain three:
the extra pass proves search completeness and never lowers the score/evidence gates or
pads the visible board. Every qualifier in the chosen tier is still selected, up to the
hard display cap of 10; any additional qualifiers are explicitly capacity drops.
