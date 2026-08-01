/**
 * input: adversarial v4 research-pass ledgers
 * output: exact-three depth, source-expansion, and row-membership regressions
 * pos: focused unit tests for editorial-completeness.ts
 */
import { describe, expect, it } from "vitest";
import { editorialCompletenessIssues } from "./editorial-completeness";
import {
  CandidateAuditSchema,
  MEME_EDITORIAL_POLICY_VERSION,
  type DailyEnvelope,
} from "./schema";

type Selection = NonNullable<DailyEnvelope["run_report"]["selection"]>;
type ResearchPass = NonNullable<Selection["research_passes"]>[number];
type PassSpec = Pick<ResearchPass, "candidates_added" | "sources_checked">;

function researchFor(specs: PassSpec[]): {
  audit: Selection["candidate_audit"];
  passes: ResearchPass[];
  total: number;
} {
  let candidateIndex = 0;
  let cumulative = 0;
  const audit: Selection["candidate_audit"] = [];
  const passes = specs.map((spec, index) => {
    const pass = index + 1;
    for (let offset = 0; offset < spec.candidates_added; offset += 1) {
      candidateIndex += 1;
      audit.push({
        candidate_key: `candidate-${candidateIndex}`,
        canonical_phrase: `候选表达${candidateIndex}`,
        outcome: "dropped_insufficient_evidence",
        research_pass: pass,
      });
    }
    cumulative += spec.candidates_added;
    return {
      pass,
      candidates_added: spec.candidates_added,
      cumulative_unique_candidates: cumulative,
      sources_checked: spec.sources_checked,
    };
  });
  return { audit, passes, total: cumulative };
}

function envelopeFor(specs: PassSpec[]): DailyEnvelope {
  const research = researchFor(specs);
  return {
    date: "2026-08-01",
    policy_version: MEME_EDITORIAL_POLICY_VERSION,
    run_report: {
      candidates_scanned: research.total,
      selection: {
        editorial_complete: true,
        candidate_audit: research.audit,
        research_passes: research.passes,
      },
    },
  } as DailyEnvelope;
}

describe("v4 exact-three second research pass", () => {
  it("accepts 30 plus 15 candidates only when pass two adds a source scope", () => {
    const envelope = envelopeFor([
      { candidates_added: 30, sources_checked: ["douyin", "weibo"] },
      { candidates_added: 15, sources_checked: ["xiaohongshu", "bilibili"] },
    ]);
    expect(editorialCompletenessIssues(envelope, 3)).toHaveLength(0);
  });

  it("rejects a 44 plus 1 ledger even though its cumulative total is 45", () => {
    const envelope = envelopeFor([
      { candidates_added: 44, sources_checked: ["douyin", "weibo"] },
      { candidates_added: 1, sources_checked: ["xiaohongshu"] },
    ]);
    expect(editorialCompletenessIssues(envelope, 3)).toContain(
      "2026-08-01 second research pass candidates_added requires >=15; received 1",
    );
  });

  it("rejects the same source scope even when its order changes", () => {
    const envelope = envelopeFor([
      { candidates_added: 30, sources_checked: ["douyin", "weibo"] },
      { candidates_added: 15, sources_checked: ["weibo", "douyin"] },
    ]);
    expect(editorialCompletenessIssues(envelope, 3)).toContain(
      "2026-08-01 second research pass must add a source scope not checked in pass 1",
    );
  });
});

it("requires research_pass on an otherwise minimal opaque safety row", () => {
  const envelope = envelopeFor([
    { candidates_added: 30, sources_checked: ["douyin", "weibo"] },
  ]);
  const row = envelope.run_report.selection!.candidate_audit[0]!;
  envelope.run_report.selection!.candidate_audit[0] = {
    candidate_key: row.candidate_key,
    outcome: "dropped_safety",
    drop_reason: "privacy",
    research_pass: row.research_pass,
  };
  expect(editorialCompletenessIssues(envelope, 4)).toHaveLength(0);
  delete envelope.run_report.selection!.candidate_audit[0]!.research_pass;
  expect(editorialCompletenessIssues(envelope, 4)).toContain(
    "candidate-1 is missing research_pass for v4",
  );
});

describe("meme candidate audit strict parsing", () => {
  it("rejects unknown subject/url fields instead of silently stripping them", () => {
    const leakedSafetyRow = {
      candidate_key: "candidate-1",
      outcome: "dropped_safety",
      drop_reason: "privacy",
      research_pass: 1,
      subject: "private person or topic",
      url: "https://example.com/private-subject",
    };
    expect(CandidateAuditSchema.safeParse(leakedSafetyRow).success).toBe(false);
  });

  it("accepts the minimal opaque safety row", () => {
    const opaque = { candidate_key: "candidate-1", outcome: "dropped_safety", drop_reason: "privacy", research_pass: 1 };
    expect(CandidateAuditSchema.safeParse(opaque).success).toBe(true);
  });
});
