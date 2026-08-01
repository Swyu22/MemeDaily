import { describe, expect, it } from "vitest";
import type { NewsEnvelope, NewsItem } from "./schema";
import { NEWS_EDITORIAL_POLICY_VERSION, NewsCandidateAuditSchema } from "./schema";
import { safetyAuditLedgerIssues } from "./editorial-policy";
import { envelopeIssueSummary } from "./rules";

type AuditRow = NonNullable<NewsEnvelope["run_report"]["selection"]>["candidate_audit"][number];

function headlineItem(headline: string): NewsItem {
  return {
    id: "2026-08-01-headline-check",
    story_identity: "headline-check",
    headline,
    summary: "这项国内服务更新直接影响公众日常生活安排。",
    category: "民生社会",
    scope: "domestic",
    topic: "民生服务",
    score: 75,
    score_breakdown: { heat: 30, freshness: 20, everyday_relevance: 15, evidence: 10 },
    heat_rank: 1,
    occurred_at: "2026-08-01T06:00:00+08:00",
    risk: { level: "safe", note: "事实性民生信息。" },
    sources: [{
      tier: "official", outlet: "测试机构", url: "https://example.com/news",
      captured_at: "2026-08-01T07:00:00+08:00", note: "公开来源。",
    }],
    published: true,
  };
}

function heldEnvelope(headline: string, policyVersion: string): NewsEnvelope {
  return {
    schema_version: "1.0", policy_version: policyVersion, rubric_version: "1.0",
    date: "2026-08-01", generated_at: "2026-08-01T08:00:00+08:00", status: "held",
    run_report: {
      candidates_scanned: 1, published: 0, dropped_safety: {}, dropped_low_confidence: 0,
      sources: ["official"], evidence_summary: {
        candidates_with_urls: 1, official_sources: 1, state_media_sources: 0,
        major_media_sources: 0, aggregator_sources: 0, dropped_insufficient_evidence: 0,
      },
    },
    items: [headlineItem(headline)],
  };
}

function safetyRow(index: number, reason = "privacy"): AuditRow {
  return {
    candidate_key: `candidate-${index}`,
    research_pass: 1,
    outcome: "dropped_safety",
    drop_reason: reason,
  };
}

describe("v3 headline emoji gate", () => {
  it("rejects a v3 headline without an Extended_Pictographic first character", () => {
    const issues = envelopeIssueSummary(heldEnvelope("医保服务范围扩大", NEWS_EDITORIAL_POLICY_VERSION));
    expect(issues).toContain("2026-08-01-headline-check v3 headline must begin with a semantic emoji");
  });

  it("accepts a v3 headline beginning with a semantic emoji", () => {
    expect(envelopeIssueSummary(heldEnvelope("🏥 医保服务范围扩大", NEWS_EDITORIAL_POLICY_VERSION))).toHaveLength(0);
  });

  it("keeps legacy envelopes compatible without an emoji prefix", () => {
    expect(envelopeIssueSummary(heldEnvelope("医保服务范围扩大", "1.0"))).toHaveLength(0);
  });
});

describe("v3 opaque safety ledger", () => {
  it("accepts only an opaque key, pass, outcome, and allowed category", () => {
    const envelope = heldEnvelope("🏥 医保服务范围扩大", NEWS_EDITORIAL_POLICY_VERSION);
    envelope.run_report.dropped_safety = { privacy: 1 };
    expect(safetyAuditLedgerIssues(envelope, [safetyRow(29)])).toHaveLength(0);
  });

  it("does not impose the v3 ledger shape on legacy envelopes", () => {
    const envelope = heldEnvelope("🏥 医保服务范围扩大", "1.0");
    const legacy = { ...safetyRow(1, "legacy free text"), candidate_key: "legacy-topic" };
    expect(safetyAuditLedgerIssues(envelope, [legacy])).toHaveLength(0);
  });
});

describe("v3 safety ledger rejection", () => {
  it("rejects content-derived details and free-form row/report categories", () => {
    const envelope = heldEnvelope("🏥 医保服务范围扩大", NEWS_EDITORIAL_POLICY_VERSION);
    envelope.run_report.dropped_safety = { "named-private-subject": 1 };
    const row: AuditRow = {
      ...safetyRow(29, "named-private-subject"), candidate_key: "private-person-name",
      story_identity: "private-person-name", occurred_at: "2026-08-01T06:00:00+08:00",
      scope: "domestic", topic: "重大事件", score: 90,
      score_breakdown: { heat: 40, freshness: 20, everyday_relevance: 20, evidence: 10 },
      qualification_tier: "strict_24h", item_id: "2026-08-01-private-person-name",
    };
    const issues = safetyAuditLedgerIssues(envelope, [row]);
    expect(issues.some((issue) => issue.includes("key must be opaque"))).toBe(true);
    expect(issues.some((issue) => issue.includes("must omit private details"))).toBe(true);
    expect(issues.some((issue) => issue.includes("drop_reason is not an allowed"))).toBe(true);
    expect(issues.some((issue) => issue.includes("dropped_safety category") && issue.includes("not allowed"))).toBe(true);
  });

  it("reconciles every safety category count exactly", () => {
    const envelope = heldEnvelope("🏥 医保服务范围扩大", NEWS_EDITORIAL_POLICY_VERSION);
    envelope.run_report.dropped_safety = { privacy: 1 };
    const issues = safetyAuditLedgerIssues(envelope, [safetyRow(28), safetyRow(29)]);
    expect(issues).toContain("safety audit categories do not match run_report.dropped_safety");
  });

});

describe("news candidate audit strict parsing", () => {
  it("rejects unknown subject/url fields instead of silently stripping them", () => {
    const leakedSafetyRow = {
      candidate_key: "candidate-1", research_pass: 1, outcome: "dropped_safety",
      drop_reason: "privacy", subject: "private person or topic",
      url: "https://example.com/private-subject",
    };
    expect(NewsCandidateAuditSchema.safeParse(leakedSafetyRow).success).toBe(false);
  });

  it("accepts the minimal opaque safety row", () => {
    expect(NewsCandidateAuditSchema.safeParse(safetyRow(1)).success).toBe(true);
  });
});
