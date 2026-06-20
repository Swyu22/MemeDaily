import { describe, expect, it } from "vitest";
import type { DailyEnvelope, MemeItem } from "./schema";
import { envelopeIssueSummary, hasPublishableEvidence, visibleItems } from "./rules";

const baseItem: MemeItem = {
  id: "2026-06-20-banwei",
  title: "班味",
  aliases: [],
  platform: ["douyin", "xiaohongshu"],
  type: "生活方式梗",
  summary: "形容上班久了身上的疲惫气质。",
  origin: "公开话题和榜单中出现的职场自嘲表达。",
  usage: "用于通勤、加班、周末前后状态对比。",
  fun_point: "把抽象疲惫具象成一种味道。",
  why_spread: "打工人共鸣强，表达门槛低。",
  lifecycle: "rising",
  brand_usage: "解压、出行、洗护品类可做去班味内容。",
  risk: { level: "low", note: "避免美化加班和内卷。" },
  score: 92,
  sources: [
    {
      tier: "platform_public",
      evidence_role: "popularity",
      platform: "douyin",
      url: "https://example.com/platform-topic",
      captured_at: "2026-06-20T07:15:00+08:00",
      note: "公开话题页可访问。",
    },
    {
      tier: "aggregator",
      evidence_role: "cross_platform",
      platform: "other",
      url: "https://example.com/archive-topic",
      captured_at: "2026-06-20T07:16:00+08:00",
      note: "公开榜单归档提到该话题。",
    },
  ],
  published: true,
};

function envelopeWith(item: MemeItem, status: DailyEnvelope["status"]): DailyEnvelope {
  return {
    schema_version: "1.0",
    policy_version: "1.0",
    rubric_version: "1.0",
    date: "2026-06-20",
    generated_at: "2026-06-20T07:42:00+08:00",
    status,
    run_report: {
      candidates_scanned: 1,
      published: status === "published" ? 1 : 0,
      dropped_safety: {},
      dropped_low_confidence: 0,
      sources: ["douyin"],
      evidence_summary: {
        candidates_with_urls: 1,
        platform_public_sources: 1,
        aggregator_sources: 1,
        search_media_sources: 0,
        spillover_sources: 0,
        dropped_insufficient_evidence: 0,
      },
    },
    items: [item],
  };
}

describe("MemeDaily publication rules", () => {
  it("accepts two independent URLs with platform or aggregator evidence", () => {
    expect(hasPublishableEvidence(baseItem)).toBe(true);
  });

  it("rejects candidates supported only by third-layer sources", () => {
    const item = {
      ...baseItem,
      sources: baseItem.sources.map((source, index) => ({
        ...source,
        tier: index === 0 ? "search_media" : "spillover",
      })),
    } satisfies MemeItem;

    expect(hasPublishableEvidence(item)).toBe(false);
  });

  it("rejects candidates with duplicate source URLs", () => {
    const item = {
      ...baseItem,
      sources: baseItem.sources.map((source) => ({
        ...source,
        url: "https://example.com/same",
      })),
    } satisfies MemeItem;

    expect(hasPublishableEvidence(item)).toBe(false);
  });

  it("hides skipped envelopes even when items are present", () => {
    expect(visibleItems(envelopeWith(baseItem, "skipped"))).toHaveLength(0);
  });

  it("reports mismatched visible counts", () => {
    const envelope = envelopeWith(baseItem, "published");
    envelope.run_report.published = 0;

    expect(envelopeIssueSummary(envelope)).toContain(
      "run_report.published does not match visible item count",
    );
  });
});
