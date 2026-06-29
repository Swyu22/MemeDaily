import { describe, expect, it } from "vitest";
import type { NewsEnvelope, NewsItem, NewsTier } from "./schema";
import {
  envelopeIssueSummary,
  hasPublishableEvidence,
  heatRankIssues,
  redLineIssues,
  visibleNews,
} from "./rules";

function source(tier: NewsTier, url: string): NewsItem["sources"][number] {
  return { tier, url, captured_at: "2026-06-29T07:15:00+08:00", note: "公开页可访问。" };
}

const baseItem: NewsItem = {
  id: "2026-06-29-shenzhou-launch",
  headline: "🚀 神舟再出发，又一次和你一起见证",
  summary: "新一批航天员顺利进驻空间站，全民共享的高光时刻。",
  category: "国家高光",
  heat_rank: 1,
  wechat_bridge: { capability: "视频号直播", note: "视频号大事件直播，朋友圈共享荣耀的标准场景。" },
  filter_pass: {
    consensus: "全民共识、零争议的国家成就。",
    bridge_fit: "视频号直播权利天然承接。",
    tone_fit: "克制见证，不喧哗。",
  },
  risk: { level: "safe", note: "无敏感点。" },
  sources: [source("state_media", "https://example.com/xinhua-shenzhou")],
  published: true,
};

function envelopeWith(items: NewsItem[], status: NewsEnvelope["status"], publishedOverride?: number): NewsEnvelope {
  return {
    schema_version: "1.0",
    policy_version: "1.0",
    rubric_version: "1.0",
    date: "2026-06-29",
    generated_at: "2026-06-29T07:42:00+08:00",
    status,
    run_report: {
      candidates_scanned: items.length,
      published: publishedOverride ?? (status === "published" || status === "partial" ? items.length : 0),
      dropped_safety: {},
      dropped_low_confidence: 0,
      sources: ["state_media"],
      evidence_summary: {
        candidates_with_urls: items.length,
        official_sources: 0,
        state_media_sources: items.length,
        major_media_sources: 0,
        aggregator_sources: 0,
        dropped_insufficient_evidence: 0,
      },
    },
    items,
  };
}

describe("hasPublishableEvidence (authority bar)", () => {
  it("accepts a single official/state_media source", () => {
    expect(hasPublishableEvidence(baseItem)).toBe(true);
  });

  it("accepts >=2 distinct URLs with a major_media source", () => {
    const item = { ...baseItem, sources: [source("major_media", "https://a.example/x"), source("aggregator", "https://b.example/y")] };
    expect(hasPublishableEvidence(item)).toBe(true);
  });

  it("rejects a lone aggregator", () => {
    const item = { ...baseItem, sources: [source("aggregator", "https://only.example/x")] };
    expect(hasPublishableEvidence(item)).toBe(false);
  });

  it("rejects two aggregators (aggregator never qualifies alone)", () => {
    const item = { ...baseItem, sources: [source("aggregator", "https://a.example/x"), source("aggregator", "https://b.example/y")] };
    expect(hasPublishableEvidence(item)).toBe(false);
  });
});

describe("visibleNews", () => {
  it("returns published items for a published envelope", () => {
    expect(visibleNews(envelopeWith([baseItem], "published"))).toHaveLength(1);
  });

  it("hides everything for skipped/held", () => {
    expect(visibleNews(envelopeWith([baseItem], "skipped"))).toHaveLength(0);
    expect(visibleNews(envelopeWith([baseItem], "held"))).toHaveLength(0);
  });
});

describe("redLineIssues", () => {
  it("does NOT flag a clean 国家高光 item that names an athlete", () => {
    const sport = { ...baseItem, id: "2026-06-29-win", headline: "🏆 中国队夺冠，朋友圈一起沸腾", summary: "运动员们拼到最后一刻，全民共享的荣耀瞬间。" };
    expect(redLineIssues(envelopeWith([sport], "published"))).toHaveLength(0);
  });

  it("flags a political subject in the headline", () => {
    const pol = { ...baseItem, headline: "某国总统访华引热议", summary: "外交场合的会谈细节。" };
    const issues = redLineIssues(envelopeWith([pol], "published"));
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]).toContain("政治/地缘/冲突");
  });

  it("flags a disaster subject in the headline (force assist-framing instead)", () => {
    const dis = { ...baseItem, headline: "某地地震致多人遇难", summary: "灾情牵动人心。" };
    const issues = redLineIssues(envelopeWith([dis], "published"));
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]).toContain("灾难事故");
  });

  it("flags a celebrity-scandal subject", () => {
    const scandal = { ...baseItem, headline: "某明星塌房上热搜", summary: "粉丝脱粉回踩。" };
    const issues = redLineIssues(envelopeWith([scandal], "published"));
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]).toContain("明星丑闻");
  });
});

describe("heatRankIssues", () => {
  it("passes for contiguous 1..N", () => {
    const items = [
      { ...baseItem, id: "2026-06-29-a", heat_rank: 1 },
      { ...baseItem, id: "2026-06-29-b", headline: "节日的味道又回来了", heat_rank: 2 },
    ];
    expect(heatRankIssues(envelopeWith(items, "published"))).toHaveLength(0);
  });

  it("fails on a gap", () => {
    const items = [
      { ...baseItem, id: "2026-06-29-a", heat_rank: 1 },
      { ...baseItem, id: "2026-06-29-b", headline: "节日的味道又回来了", heat_rank: 3 },
    ];
    expect(heatRankIssues(envelopeWith(items, "published")).length).toBeGreaterThan(0);
  });

  it("fails on a duplicate rank", () => {
    const items = [
      { ...baseItem, id: "2026-06-29-a", heat_rank: 1 },
      { ...baseItem, id: "2026-06-29-b", headline: "节日的味道又回来了", heat_rank: 1 },
    ];
    expect(heatRankIssues(envelopeWith(items, "published")).length).toBeGreaterThan(0);
  });
});

describe("envelopeIssueSummary", () => {
  it("passes a clean published envelope", () => {
    expect(envelopeIssueSummary(envelopeWith([baseItem], "published"))).toHaveLength(0);
  });

  it("flags a run_report.published mismatch", () => {
    const env = envelopeWith([baseItem], "published", 5);
    expect(envelopeIssueSummary(env).some((i) => i.includes("run_report.published"))).toBe(true);
  });

  it("flags a published envelope with zero items", () => {
    expect(envelopeIssueSummary(envelopeWith([], "published")).some((i) => i.includes("zero items"))).toBe(true);
  });
});
