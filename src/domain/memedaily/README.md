# MemeDaily Domain Module

Pure schema, loading, labels, and deterministic editorial gates for meme data. This
module must not import UI, Next.js, workflows, or infrastructure code.

| File | Responsibility |
| --- | --- |
| `README.md` | Module boundary and file index |
| `schema.ts` | Backward-compatible JSON envelope and item contracts |
| `data.ts` | Static envelope loading and archive access |
| `labels.ts` | Reader-facing labels and presentation-safe projections |
| `labels.test.ts` | Heat/freshness component sorting and historical fallback regressions |
| `rules.ts` | Core evidence, safety, lifecycle, and minimum-output gates |
| `rules.test.ts` | Core evidence, safety, lifecycle, and historical-policy regressions |
| `dynamic-selection.ts` | Post-2026-07-27 score, audit, tier, identity, and recurrence gates |
| `dynamic-selection.test.ts` | Score, activity, identity, tier, and recurrence regressions |
