import { describe, expect, it } from "vitest";
import type { NewsEnvelope, NewsItem, NewsTier } from "./schema";
import { NEWS_EDITORIAL_POLICY_VERSION, NewsItemSchema } from "./schema";
import { canonicalNewsEvidenceUrl } from "./editorial-policy";
import {
  envelopeIssueSummary,
  hasPublishableEvidence,
  headlineCasualtyIssues,
  heatRankIssues,
  internationalCoverageWarnings,
  redLineIssues,
  visibleNews,
} from "./rules";

function source(tier: NewsTier, url: string, outlet = "测试媒体"): NewsItem["sources"][number] {
  return { tier, outlet, url, captured_at: "2026-06-29T07:15:00+08:00", note: "公开页可访问。" };
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

function minimumDay(
  date: string,
  status: NewsEnvelope["status"],
  itemCount: number,
): NewsEnvelope {
  const items = Array.from({ length: itemCount }, (_, index) => ({
    ...baseItem,
    id: `${date}-verified-${index + 1}`,
    headline: `📰 今日民生进展第${index + 1}条`,
    heat_rank: index + 1,
    sources: [
      source("state_media", `https://example.com/${date}/news-${index + 1}`),
    ],
  }));
  const envelope = envelopeWith(items, status);
  envelope.date = date;
  return envelope;
}

type NewsCandidateAudit = NonNullable<NewsEnvelope["run_report"]["selection"]>["candidate_audit"][number];

function scoreBreakdown(score: number): NonNullable<NewsItem["score_breakdown"]> {
  const freshness = 20;
  let everyday_relevance = 15;
  let evidence = 10;
  const heat = Math.min(40, score - freshness - everyday_relevance - evidence);
  let remaining = score - heat - freshness - everyday_relevance - evidence;
  const relevanceExtra = Math.min(10, remaining);
  everyday_relevance += relevanceExtra;
  remaining -= relevanceExtra;
  evidence += remaining;
  return { heat, freshness, everyday_relevance, evidence };
}

function internationalFields(index: number): Partial<NewsItem> {
  const connectionUrl = `https://state.example/story-${index}`;
  return {
    category: "国际",
    topic: "重大事件",
    primary_organization: `国际机构${index}`,
    audience_relevance: {
      basis: "direct_china_impact",
      impact_scale: "direct_china_public",
      china_connection: "相关服务和标准同步覆盖中国公众。",
      everyday_impact: "直接影响健康信息和日常生活选择。",
      score: 20,
      connection_evidence: { url: connectionUrl, note: "该报道明确说明对中国公众的直接影响。" },
    },
    sources: [
      source("state_media", connectionUrl, `央媒${index}`),
      source("major_media", `https://major.example/story-${index}`, `主流媒体${index}`),
    ],
  };
}

function domesticV3Item(index: number, score: number): NewsItem {
  return {
    ...baseItem,
    id: `2026-08-01-story-${index}`,
    story_identity: `story-${index}`,
    headline: `📰 今日生活热点第${index}条`,
    summary: "这项国内进展直接影响公众日常办事、消费和生活安排。",
    category: "民生社会",
    scope: "domestic",
    topic: "民生服务",
    score,
    score_breakdown: scoreBreakdown(score),
    heat_rank: index,
    occurred_at: "2026-08-01T06:00:00+08:00",
    sources: [source("state_media", `https://state.example/domestic-${index}`, `央媒${index}`)],
  };
}

function v3Item(index: number, scope: "domestic" | "international", score: number): NewsItem {
  const domestic = domesticV3Item(index, score);
  if (scope === "domestic") return domestic;
  return {
    ...domestic,
    ...internationalFields(index),
    scope: "international",
    summary: "这项全球性进展与中国公众的日常健康和服务选择存在直接关联。",
  };
}

function selectedAudit(item: NewsItem): NewsCandidateAudit {
  return {
    candidate_key: item.id,
    story_identity: item.story_identity,
    research_pass: 1,
    occurred_at: item.occurred_at ?? "2026-08-01T06:00:00+08:00",
    scope: item.scope ?? "domestic",
    topic: item.topic ?? "民生服务",
    outcome: "selected",
    item_id: item.id,
    score: item.score,
    score_breakdown: item.score_breakdown,
    qualification_tier: "strict_24h",
  };
}

function droppedAudit(index: number, researchPass: 1 | 2): NewsCandidateAudit {
  return {
    candidate_key: `candidate-${index}`,
    story_identity: `candidate-story-${index}`,
    research_pass: researchPass,
    occurred_at: "2026-08-01T06:00:00+08:00",
    scope: "domestic",
    topic: "民生服务",
    outcome: "dropped_low_confidence",
    score: 60,
    score_breakdown: scoreBreakdown(60),
    drop_reason: "热度与公共关联不足",
  };
}

function candidateAudit(items: NewsItem[], auditSize: number): NewsCandidateAudit[] {
  return [
    ...items.map(selectedAudit),
    ...Array.from({ length: auditSize - items.length }, (_, index) => {
      const absoluteIndex = index + items.length;
      return droppedAudit(absoluteIndex + 1, absoluteIndex < 30 ? 1 : 2);
    }),
  ];
}

function researchPasses(itemCount: number): NonNullable<NewsEnvelope["run_report"]["selection"]>["research_passes"] {
  if (itemCount !== 3) {
    return [{ pass: 1, candidates_added: 30, cumulative_unique_candidates: 30, source_scope: ["国内综合热榜"] }];
  }
  return [
    { pass: 1, candidates_added: 30, cumulative_unique_candidates: 30, source_scope: ["国内综合热榜"] },
    { pass: 2, candidates_added: 15, cumulative_unique_candidates: 45, source_scope: ["地方民生与行业媒体"] },
  ];
}

function v3Envelope(scopes: ("domestic" | "international")[]): NewsEnvelope {
  const items = scopes.map((scope, index) => v3Item(index + 1, scope, 95 - index));
  const auditSize = items.length === 3 ? 45 : 30;
  const envelope = envelopeWith(items, "published");
  envelope.date = "2026-08-01";
  envelope.generated_at = "2026-08-01T08:00:00+08:00";
  envelope.policy_version = NEWS_EDITORIAL_POLICY_VERSION;
  envelope.run_report.candidates_scanned = auditSize;
  envelope.run_report.dropped_low_confidence = auditSize - items.length;
  envelope.run_report.dropped_quota = 0;
  envelope.run_report.dropped_capacity = 0;
  envelope.run_report.selection = {
    tier: "strict_24h",
    qualified: { strict_24h: items.length, relaxed_48h: items.length, relaxed_72h: items.length },
    editorial_complete: true,
    research_passes: researchPasses(items.length),
    candidate_audit: candidateAudit(items, auditSize),
  };
  return envelope;
}

function requiredSelection(envelope: NewsEnvelope): NonNullable<NewsEnvelope["run_report"]["selection"]> {
  const selection = envelope.run_report.selection;
  if (!selection) throw new Error("selection fixture missing");
  return selection;
}

function setItemScores(items: NewsItem[], score: number): void {
  for (const item of items) {
    item.score = score;
    item.score_breakdown = scoreBreakdown(score);
  }
}

function setAuditScores(selection: NonNullable<NewsEnvelope["run_report"]["selection"]>, score: number): void {
  for (const row of selection.candidate_audit.filter((candidate) => candidate.outcome === "selected")) {
    row.score = score;
    row.score_breakdown = scoreBreakdown(score);
    row.qualification_tier = selection.tier;
  }
}

function setSelectionTier(
  envelope: NewsEnvelope,
  tier: "relaxed_48h" | "relaxed_72h",
  score: number,
): void {
  const selection = requiredSelection(envelope);
  selection.tier = tier;
  setItemScores(envelope.items, score);
  setAuditScores(selection, score);
  selection.qualified = {
    strict_24h: 0,
    relaxed_48h: tier === "relaxed_48h" ? envelope.items.length : 0,
    relaxed_72h: envelope.items.length,
  };
  envelope.status = "partial";
}

function promoteDroppedCandidate(
  envelope: NewsEnvelope,
  candidateKey: string,
  scope: "domestic" | "international",
  outcome: "dropped_quota" | "dropped_capacity",
): void {
  const selection = requiredSelection(envelope);
  const row = selection.candidate_audit.find((candidate) => candidate.candidate_key === candidateKey);
  if (!row) throw new Error("candidate fixture missing");
  row.scope = scope;
  row.topic = scopeTopic(scope);
  row.outcome = outcome;
  row.score = 80;
  row.score_breakdown = scoreBreakdown(80);
  row.qualification_tier = "strict_24h";
  row.drop_reason = dropReason(outcome);
  selection.qualified.strict_24h += 1;
  selection.qualified.relaxed_48h += 1;
  selection.qualified.relaxed_72h += 1;
  envelope.run_report.dropped_low_confidence -= 1;
  envelope.run_report[dropReportField(outcome)] = 1;
}

function scopeTopic(scope: "domestic" | "international"): NewsCandidateAudit["topic"] {
  return scope === "international" ? "重大事件" : "民生服务";
}

function dropReason(outcome: "dropped_quota" | "dropped_capacity"): string {
  return outcome === "dropped_quota" ? "国际比例配额" : "超过十条容量";
}

function dropReportField(outcome: "dropped_quota" | "dropped_capacity"): "dropped_quota" | "dropped_capacity" {
  return outcome === "dropped_quota" ? "dropped_quota" : "dropped_capacity";
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

  it("does NOT flag a 民生 disaster-event item (v2: 地震 is now a wanted topic)", () => {
    const quake = { ...baseItem, id: "2026-06-29-quake", headline: "🌏 四川宜宾发生地震，当地启动应急响应", summary: "震区交通与通信正在逐步恢复，救援力量已抵达现场。" };
    expect(redLineIssues(envelopeWith([quake], "published"))).toHaveLength(0);
  });
});

describe("redLineIssues livelihood framing", () => {
  it("allows livelihood policy wording that the old broad gate wrongly blocked", () => {
    const policy = { ...baseItem, headline: "医保新政策出台，异地结算范围扩大", summary: "参保人可通过线上渠道查询办理流程与适用地区。" };
    expect(redLineIssues(envelopeWith([policy], "published"))).toHaveLength(0);
  });

  it("still flags political-propaganda and meeting framing", () => {
    const meeting = { ...baseItem, headline: "专题会议学习贯彻重要讲话精神", summary: "会议传达会议精神并部署相关工作。" };
    const issues = redLineIssues(envelopeWith([meeting], "published"));
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]).toContain("政治宣传/会议");
  });

  it("flags a celebrity-scandal subject", () => {
    const scandal = { ...baseItem, headline: "某明星塌房上热搜", summary: "粉丝脱粉回踩。" };
    const issues = redLineIssues(envelopeWith([scandal], "published"));
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]).toContain("明星丑闻");
  });
});

describe("headlineCasualtyIssues", () => {
  it("flags casualty/relocation figures in a disaster headline", () => {
    const dis = { ...baseItem, id: "2026-06-29-quake2", headline: "🌏某地地震，13人轻伤225人转移", summary: "应急响应已启动，救援力量抵达现场处置，社会秩序稳定。" };
    expect(headlineCasualtyIssues(envelopeWith([dis], "published")).length).toBeGreaterThan(0);
  });

  it("does NOT flag a neutral people-count headline", () => {
    const ok = { ...baseItem, id: "2026-06-29-run", headline: "🏃5000人参与城市马拉松", summary: "清晨开跑，沿途设置补给与医疗保障点位，市民有序参与。" };
    expect(headlineCasualtyIssues(envelopeWith([ok], "published"))).toHaveLength(0);
  });
});

describe("NewsItemSchema source url hardening (no javascript:/data:)", () => {
  it("rejects a non-http(s) source url", () => {
    const bad = { ...baseItem, sources: [source("state_media", "javascript:alert(1)")] };
    expect(NewsItemSchema.safeParse(bad).success).toBe(false);
  });

  it("accepts an https source url", () => {
    expect(NewsItemSchema.safeParse(baseItem).success).toBe(true);
  });

  it("requires a named outlet for every reader-visible source", () => {
    const unnamed = {
      ...baseItem,
      sources: [{
        tier: "state_media",
        url: "https://example.com/unnamed",
        captured_at: "2026-06-29T07:15:00+08:00",
        note: "公开页可访问。",
      }],
    };
    expect(NewsItemSchema.safeParse(unnamed).success).toBe(false);
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

describe("internationalCoverageWarnings (soft — warn, never fail)", () => {
  it("warns when no 国际 item is present", () => {
    const warnings = internationalCoverageWarnings(envelopeWith([baseItem], "published"));
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain("国际");
  });

  it("is silent when a 国际 item is present", () => {
    const intl = { ...baseItem, id: "2026-06-29-intl", category: "国际" as const, headline: "🔭 詹姆斯·韦布望远镜再传新影像", summary: "国际团队公布一批深空图像，展示遥远星系的细节。" };
    expect(internationalCoverageWarnings(envelopeWith([baseItem, intl], "published"))).toHaveLength(0);
  });

  it("is silent for an empty/skipped envelope (nothing to warn about)", () => {
    expect(internationalCoverageWarnings(envelopeWith([baseItem], "skipped"))).toHaveLength(0);
  });

  it("does not affect the hard-fail envelopeIssueSummary", () => {
    // a clean domestic-only envelope must still PASS the hard gate (warning is separate)
    expect(envelopeIssueSummary(envelopeWith([baseItem], "published"))).toHaveLength(0);
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

describe("envelopeIssueSummary minimum and time gates", () => {
  it("keeps a historical skipped day valid before the minimum-output cutoff", () => {
    expect(envelopeIssueSummary(minimumDay("2026-07-25", "skipped", 0))).toHaveLength(0);
  });

  it("keeps a post-cutoff held day available for operator emergency removal", () => {
    expect(envelopeIssueSummary(minimumDay("2026-07-26", "held", 0))).toHaveLength(0);
  });

  it("rejects a post-cutoff skipped day even with no filler", () => {
    expect(envelopeIssueSummary(minimumDay("2026-07-26", "skipped", 0))).toContain(
      "2026-07-26 requires status published/partial with at least 3 visible items; got skipped with 0",
    );
  });

  it("rejects a post-cutoff day with fewer than 3 visible items", () => {
    expect(envelopeIssueSummary(minimumDay("2026-07-26", "published", 2))).toContain(
      "2026-07-26 requires status published/partial with at least 3 visible items; got published with 2",
    );
  });

  it.each(["published", "partial"] as const)(
    "accepts post-cutoff status %s with 3 verified visible items",
    (status) => {
      expect(envelopeIssueSummary(minimumDay("2026-07-26", status, 3))).toHaveLength(0);
    },
  );
});

describe("envelopeIssueSummary timestamp gates", () => {
  it("flags generated/source timestamps after the trusted publish time", () => {
    const env = envelopeWith([baseItem], "published");
    env.published_at = "2026-06-29T07:10:00+08:00";
    const issues = envelopeIssueSummary(env);
    expect(issues.some((issue) => issue.includes("generated_at") && issue.includes("published_at"))).toBe(true);
    expect(issues.some((issue) => issue.includes("source captured_at") && issue.includes("published_at"))).toBe(true);
  });
});

describe("v3 domestic-majority editorial gate", () => {
  it("keeps legacy envelopes compatible without v3 metadata or selection audit", () => {
    expect(envelopeIssueSummary(envelopeWith([baseItem], "published"))).toHaveLength(0);
  });

  it("accepts a complete exactly-three domestic digest after a 45-candidate second pass", () => {
    const envelope = v3Envelope(["domestic", "domestic", "domestic"]);
    expect(envelopeIssueSummary(envelope)).toHaveLength(0);
    expect(internationalCoverageWarnings(envelope)).toHaveLength(0);
  });

  it("publishes every qualified domestic item instead of stopping at three", () => {
    expect(envelopeIssueSummary(v3Envelope([
      "domestic", "domestic", "domestic", "domestic", "domestic",
    ]))).toHaveLength(0);
  });

  it.each([
    ["relaxed_48h", 72],
    ["relaxed_72h", 67],
  ] as const)("accepts score-derived %s only with partial status", (tier, score) => {
    const envelope = v3Envelope(["domestic", "domestic", "domestic"]);
    setSelectionTier(envelope, tier, score);
    expect(envelopeIssueSummary(envelope)).toHaveLength(0);
  });
});

describe("v3 score and publication status", () => {
  it("rejects a declared qualification tier that disagrees with the score", () => {
    const envelope = v3Envelope(["domestic", "domestic", "domestic"]);
    const row = envelope.run_report.selection?.candidate_audit[0];
    const item = envelope.items[0];
    if (!row || !item) throw new Error("score fixture missing");
    row.score = 70;
    row.score_breakdown = scoreBreakdown(70);
    item.score = 70;
    item.score_breakdown = scoreBreakdown(70);
    const issues = envelopeIssueSummary(envelope);
    expect(issues.some((issue) => issue.includes("does not match score/time-derived relaxed_48h"))).toBe(true);
  });

  it("rejects partial status for a strict selection tier", () => {
    const envelope = v3Envelope(["domestic", "domestic", "domestic"]);
    envelope.status = "partial";
    expect(envelopeIssueSummary(envelope).some((issue) =>
      issue.includes("strict_24h requires status published")
    )).toBe(true);
  });
});

describe("v3 domestic/international mix", () => {
  it("rejects an international item in a three-item digest", () => {
    const issues = envelopeIssueSummary(v3Envelope(["domestic", "domestic", "international"]));
    expect(issues.some((issue) => issue.includes("domestic>=3") && issue.includes("international<=0"))).toBe(true);
  });

  it("allows one representative international item only when the digest has at least four items", () => {
    expect(envelopeIssueSummary(v3Envelope([
      "domestic", "domestic", "domestic", "international",
    ]))).toHaveLength(0);
  });
});

describe("v3 international evidence and concentration", () => {
  it("does not treat one international official page as proof of heat", () => {
    const envelope = v3Envelope(["domestic", "domestic", "domestic", "international"]);
    const international = envelope.items[3];
    if (international) international.sources = [source("official", "https://agency.example/release", "海外机构")];
    const issues = envelopeIssueSummary(envelope);
    expect(issues.some((issue) => issue.includes("independent URLs/outlets"))).toBe(true);
  });

  it("requires structured China/everyday audience relevance for international stories", () => {
    const envelope = v3Envelope(["domestic", "domestic", "domestic", "international"]);
    const international = envelope.items[3];
    if (international) delete international.audience_relevance;
    expect(envelopeIssueSummary(envelope).some((issue) => issue.includes("missing audience_relevance"))).toBe(true);
  });

  it("limits repeated international institutions and space/NASA concentration", () => {
    const envelope = v3Envelope([
      "domestic", "domestic", "domestic", "domestic", "domestic", "domestic",
      "international", "international",
    ]);
    for (const item of envelope.items.slice(6)) {
      item.primary_organization = "NASA";
      item.topic = "太空航天";
    }
    const issues = envelopeIssueSummary(envelope);
    expect(issues.some((issue) => issue.includes("organization nasa appears 2"))).toBe(true);
    expect(issues.some((issue) => issue.includes("space/NASA stories appear 2"))).toBe(true);
  });
});

describe("v3 research completeness", () => {
  it("rejects an exactly-three digest without a 15-candidate second research pass", () => {
    const envelope = v3Envelope(["domestic", "domestic", "domestic"]);
    const selection = envelope.run_report.selection;
    if (!selection) throw new Error("selection fixture missing");
    selection.candidate_audit = selection.candidate_audit.slice(0, 30);
    selection.research_passes = [
      { pass: 1, candidates_added: 30, cumulative_unique_candidates: 30, source_scope: ["国内综合热榜"] },
    ];
    envelope.run_report.candidates_scanned = 30;
    envelope.run_report.dropped_low_confidence = 27;
    const issues = envelopeIssueSummary(envelope);
    expect(issues.some((issue) => issue.includes("require >=45 unique candidates"))).toBe(true);
    expect(issues.some((issue) => issue.includes("require a second research pass"))).toBe(true);
  });
});

describe("v3 research-pass ledger accounting", () => {
  it("reconciles each research pass candidates_added against its candidate rows", () => {
    const envelope = v3Envelope(["domestic", "domestic", "domestic", "domestic"]);
    const selection = envelope.run_report.selection;
    if (!selection) throw new Error("selection fixture missing");
    selection.research_passes[0]!.candidates_added = 29;
    const issues = envelopeIssueSummary(envelope);
    expect(issues.some((issue) => issue.includes("candidates_added=29") && issue.includes("audit rows=30"))).toBe(true);
  });

  it("rejects candidate rows that reference an undeclared research pass", () => {
    const envelope = v3Envelope(["domestic", "domestic", "domestic", "domestic"]);
    const row = envelope.run_report.selection?.candidate_audit.at(-1);
    if (!row) throw new Error("candidate fixture missing");
    row.research_pass = 2;
    expect(envelopeIssueSummary(envelope).some((issue) =>
      issue.includes("references undeclared research pass 2")
    )).toBe(true);
  });
});

describe("v3 quota outcome accounting", () => {
  it("labels a top-ten international candidate displaced by the 25% cap as quota", () => {
    const envelope = v3Envelope([
      "domestic", "domestic", "domestic", "domestic", "domestic", "domestic",
      "international", "international",
    ]);
    promoteDroppedCandidate(envelope, "candidate-9", "international", "dropped_quota");
    expect(envelopeIssueSummary(envelope)).toHaveLength(0);
  });

  it("rejects calling a geography-displaced top-ten candidate capacity", () => {
    const envelope = v3Envelope([
      "domestic", "domestic", "domestic", "domestic", "domestic", "domestic",
      "international", "international",
    ]);
    promoteDroppedCandidate(envelope, "candidate-9", "international", "dropped_capacity");
    expect(envelopeIssueSummary(envelope).some((issue) =>
      issue.includes("candidate-9 must be dropped_quota")
    )).toBe(true);
  });
});

describe("v3 capacity outcome accounting", () => {
  it("labels a qualified candidate below the unconstrained top ten as capacity", () => {
    const envelope = v3Envelope(Array.from({ length: 10 }, () => "domestic"));
    promoteDroppedCandidate(envelope, "candidate-11", "domestic", "dropped_capacity");
    expect(envelopeIssueSummary(envelope)).toHaveLength(0);
  });

  it("rejects calling an over-capacity candidate quota", () => {
    const envelope = v3Envelope(Array.from({ length: 10 }, () => "domestic"));
    promoteDroppedCandidate(envelope, "candidate-11", "domestic", "dropped_quota");
    expect(envelopeIssueSummary(envelope).some((issue) =>
      issue.includes("candidate-11 must be dropped_capacity")
    )).toBe(true);
  });
});

describe("v3 maximum selection", () => {
  it("rejects reporting only three when four strict qualified domestic candidates exist", () => {
    const envelope = v3Envelope(["domestic", "domestic", "domestic", "domestic"]);
    const selection = envelope.run_report.selection;
    if (!selection) throw new Error("selection fixture missing");
    envelope.items = envelope.items.slice(0, 3);
    envelope.run_report.published = 3;
    const fourth = selection.candidate_audit.find((row) => row.candidate_key.endsWith("story-4"));
    if (!fourth) throw new Error("fourth candidate fixture missing");
    fourth.outcome = "dropped_capacity";
    delete fourth.item_id;
    envelope.run_report.dropped_capacity = 1;
    const issues = envelopeIssueSummary(envelope);
    expect(issues.some((issue) => issue.includes("maximum top-scoring set"))).toBe(true);
  });
});

describe("v3 canonical evidence identity", () => {
  it("drops tracking/fragment variants but preserves meaningful query ids", () => {
    const tracked = "https://www.example.com/story?id=7&utm_source=x#top";
    expect(canonicalNewsEvidenceUrl(tracked)).toBe(canonicalNewsEvidenceUrl("https://example.com/story?fbclid=y&id=7"));
    expect(canonicalNewsEvidenceUrl(tracked)).not.toBe(canonicalNewsEvidenceUrl("https://example.com/story?id=8"));
  });
});

describe("v3 score/time integrity", () => {
  it("uses the later of score and event-age tiers", () => {
    const envelope = v3Envelope(["domestic", "domestic", "domestic"]);
    const item = envelope.items[0]!;
    const row = requiredSelection(envelope).candidate_audit[0]!;
    item.occurred_at = "2026-07-31T02:00:00+08:00";
    row.occurred_at = item.occurred_at;
    expect(envelopeIssueSummary(envelope).some((issue) =>
      issue.includes("score/time-derived relaxed_48h")
    )).toBe(true);
  });

  it("rejects future, over-72h, and low-everyday-relevance candidates", () => {
    const envelope = v3Envelope(["domestic", "domestic", "domestic"]);
    const selection = requiredSelection(envelope);
    envelope.items[0]!.occurred_at = "2026-08-01T09:00:00+08:00";
    selection.candidate_audit[0]!.occurred_at = envelope.items[0]!.occurred_at!;
    envelope.items[1]!.occurred_at = "2026-07-29T07:00:00+08:00";
    selection.candidate_audit[1]!.occurred_at = envelope.items[1]!.occurred_at!;
    const weak = { heat: 40, freshness: 20, everyday_relevance: 14, evidence: 15 };
    Object.assign(envelope.items[2]!, { score: 89, score_breakdown: weak });
    Object.assign(selection.candidate_audit[2]!, { score: 89, score_breakdown: weak });
    const issues = envelopeIssueSummary(envelope);
    expect(issues.some((issue) => issue.includes("occurred_at is after"))).toBe(true);
    expect(issues.some((issue) => issue.includes("score/time-derived undefined"))).toBe(true);
    expect(issues.some((issue) => issue.includes("everyday_relevance 14"))).toBe(true);
  });
});

describe("v3 international and story identity", () => {
  it("rejects routine-local impact and unmatched direct-China evidence", () => {
    const envelope = v3Envelope(["domestic", "domestic", "domestic", "international"]);
    const relevance = envelope.items[3]!.audience_relevance!;
    relevance.impact_scale = "routine_local";
    relevance.connection_evidence = { url: "https://other.example/no-match", note: "未对应条目来源的连接说明。" };
    const issues = envelopeIssueSummary(envelope);
    expect(issues.some((issue) => issue.includes("routine_local"))).toBe(true);
    expect(issues.some((issue) => issue.includes("must match one of the item sources"))).toBe(true);
  });

  it.each([["UNICEF", "联合国儿童基金会", "unicef"], ["ESA", "欧洲航天局", "esa"]])(
    "normalizes bilingual organization aliases %s/%s",
    (left, right, key) => {
      const scopes = [...Array.from({ length: 6 }, () => "domestic" as const), "international" as const, "international" as const];
      const envelope = v3Envelope(scopes);
      envelope.items[6]!.primary_organization = left;
      envelope.items[7]!.primary_organization = right;
      expect(envelopeIssueSummary(envelope).some((issue) => issue.includes(`organization ${key} appears 2`))).toBe(true);
    },
  );

  it("deduplicates story identity independently of candidate key", () => {
    const envelope = v3Envelope(["domestic", "domestic", "domestic"]);
    const rows = requiredSelection(envelope).candidate_audit;
    rows[4]!.story_identity = rows[3]!.story_identity;
    expect(envelopeIssueSummary(envelope)).toContain("candidate_audit has duplicate story_identity values");
  });
});

describe("v3 global-systemic threshold", () => {
  it("rejects a nominal global event below the higher relevance/heat/evidence floors", () => {
    const envelope = v3Envelope(["domestic", "domestic", "domestic", "international"]);
    const item = envelope.items[3]!;
    const row = requiredSelection(envelope).candidate_audit[3]!;
    item.audience_relevance = {
      basis: "global_major_event", impact_scale: "global_systemic",
      china_connection: "全球系统性变化会间接影响中国公众。", everyday_impact: "影响普通人的健康与日常选择。", score: 19,
    };
    const weak = { heat: 29, freshness: 20, everyday_relevance: 15, evidence: 11 };
    Object.assign(item, { score: 75, score_breakdown: weak });
    Object.assign(row, { score: 75, score_breakdown: weak });
    const issues = envelopeIssueSummary(envelope);
    expect(issues.some((issue) => issue.includes("audience relevance 19 is below 20"))).toBe(true);
    expect(issues.some((issue) => issue.includes("global event heat is below 30"))).toBe(true);
    expect(issues.some((issue) => issue.includes("global event evidence is below 12"))).toBe(true);
  });
});

describe("v3 exact-three pass depth", () => {
  it("rejects a 1+44 ledger even though the total is 45", () => {
    const envelope = v3Envelope(["domestic", "domestic", "domestic"]);
    const selection = requiredSelection(envelope);
    selection.candidate_audit.forEach((row, index) => { row.research_pass = index === 0 ? 1 : 2; });
    selection.research_passes = [
      { pass: 1, candidates_added: 1, cumulative_unique_candidates: 1, source_scope: ["国内综合热榜"] },
      { pass: 2, candidates_added: 44, cumulative_unique_candidates: 45, source_scope: ["行业媒体"] },
    ];
    expect(envelopeIssueSummary(envelope)).toContain("first research pass must add at least 30 unique candidates");
  });

  it("rejects a second pass that does not introduce a new source scope", () => {
    const envelope = v3Envelope(["domestic", "domestic", "domestic"]);
    requiredSelection(envelope).research_passes[1]!.source_scope = ["国内综合热榜"];
    expect(envelopeIssueSummary(envelope)).toContain("second research pass must add at least one new source_scope");
  });
});
