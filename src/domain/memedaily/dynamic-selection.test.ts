import { describe, expect, it } from "vitest";
import {
  DailyEnvelopeSchema,
  MEME_EDITORIAL_POLICY_VERSION,
  type DailyEnvelope,
  type MemeItem,
} from "./schema";
import { dynamicSelectionIssues } from "./dynamic-selection";

type Selection = NonNullable<DailyEnvelope["run_report"]["selection"]>;
type SelectionTier = Selection["tier"];
type SelectionQualified = Selection["qualified"];
type CandidateAudit = Selection["candidate_audit"][number];
const firstDate = "2026-07-27";
const secondDate = "2026-07-28";
const defaultScore = {
  heat: 32,
  freshness: 25,
  reusability: 18,
  evidence: 8,
};

const baseItem: MemeItem = {
  id: `${firstDate}-base`,
  title: "基础梗",
  aliases: [],
  canonical_phrase: "基础梗",
  platform: ["douyin", "weibo"],
  type: "句式梗",
  summary: "可被不同网友套用到无关场景的语言模板。",
  origin: "公开内容页出现该表达。",
  usage: "网友将句式替换成自己的生活场景。",
  fun_point: "同一结构可制造不同反差。",
  why_spread: "已验证：公开榜单和用法页仍有活动。推测：句式门槛低。",
  lifecycle: "rising",
  brand_usage: "可用于安全的生活场景改写。",
  risk: { level: "low", note: "避免带入人物争议。" },
  days_on_list: 1,
  score: 83,
  score_breakdown: defaultScore,
  sources: [],
  published: true,
};

function scoredItem(
  date: string,
  id: string,
  title: string,
  observedAt: string,
  daysOnList = 1,
  scoreBreakdown = defaultScore,
): MemeItem {
  const score = Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0);
  const source = (index: number): MemeItem["sources"][number] => ({
    tier: index === 0 ? "platform_public" : "aggregator",
    evidence_role: index === 0 ? "popularity" : "cross_platform",
    platform: index === 0 ? "douyin" : "weibo",
    url: `https://example.com/${date}/${id}/source-${index + 1}`,
    observed_at: observedAt,
    captured_at: `${date}T07:30:00+08:00`,
    note: "公开证据显示当前活动。",
  });
  return {
    ...baseItem,
    id,
    title,
    canonical_phrase: title,
    days_on_list: daysOnList,
    score,
    score_breakdown: scoreBreakdown,
    sources: [source(0), source(1)],
  };
}

function qualifiedCountsFor(
  tier: SelectionTier,
  itemCount: number,
): SelectionQualified {
  const byTier: Record<SelectionTier, SelectionQualified> = {
    strict_24h: {
      strict_24h: itemCount,
      relaxed_48h: itemCount,
      relaxed_72h: itemCount,
    },
    relaxed_48h: {
      strict_24h: 0,
      relaxed_48h: itemCount,
      relaxed_72h: itemCount,
    },
    relaxed_72h: {
      strict_24h: 0,
      relaxed_48h: 0,
      relaxed_72h: itemCount,
    },
  };
  return byTier[tier];
}

function selectedAuditRow(item: MemeItem): CandidateAudit {
  const source = item.sources.find((candidate) =>
    candidate.evidence_role !== "origin" && candidate.observed_at,
  )!;
  return {
    candidate_key: item.id,
    canonical_phrase: item.canonical_phrase,
    outcome: "selected",
    item_id: item.id,
    score: item.score,
    score_breakdown: item.score_breakdown,
    activity: {
      evidence_role: source.evidence_role as "popularity" | "usage_context" | "cross_platform",
      url: source.url,
      observed_at: source.observed_at!,
    },
  };
}

function droppedAuditRow(date: string, index: number): CandidateAudit {
  return {
    candidate_key: `candidate-${index + 1}`,
    canonical_phrase: `候选表达${index + 1}`,
    outcome: "dropped_low_confidence",
    score: 50,
    score_breakdown: {
      heat: 20,
      freshness: 10,
      reusability: 14,
      evidence: 6,
    },
    activity: {
      evidence_role: "popularity",
      url: `https://example.com/${date}/candidate-${index + 1}`,
      observed_at: `${date}T07:00:00+08:00`,
    },
  };
}

function candidateAuditFor(date: string, items: MemeItem[]): CandidateAudit[] {
  const selected = items.map(selectedAuditRow);
  const dropped = Array.from(
    { length: 30 - items.length },
    (_, index) => droppedAuditRow(date, index),
  );
  return [...selected, ...dropped];
}

function runReportFor(
  date: string,
  tier: SelectionTier,
  items: MemeItem[],
): DailyEnvelope["run_report"] {
  const itemCount = items.length;
  return {
    candidates_scanned: 30,
    published: itemCount,
    dropped_safety: {},
    dropped_low_confidence: 30 - itemCount,
    dropped_capacity: 0,
    sources: ["douyin", "weibo"],
    evidence_summary: {
      candidates_with_urls: 30,
      platform_public_sources: itemCount,
      aggregator_sources: itemCount,
      search_media_sources: 0,
      spillover_sources: 0,
      dropped_insufficient_evidence: 0,
    },
    selection: {
      tier,
      qualified: qualifiedCountsFor(tier, itemCount),
      candidate_audit: candidateAuditFor(date, items),
    },
  };
}

function selectedDay(
  date: string,
  tier: SelectionTier,
  items: MemeItem[],
): DailyEnvelope {
  return {
    schema_version: "1.0",
    policy_version: "2.0",
    rubric_version: "2.0",
    date,
    generated_at: `${date}T08:00:00+08:00`,
    published_at: `${date}T08:00:00+08:00`,
    status: tier === "strict_24h" ? "published" : "partial",
    run_report: runReportFor(date, tier, items),
    items,
  };
}

function auditForCandidateCount(
  date: string, items: MemeItem[], candidateCount: number,
): CandidateAudit[] {
  return [
    ...items.map(selectedAuditRow),
    ...Array.from(
      { length: candidateCount - items.length },
      (_, index) => droppedAuditRow(date, index),
    ),
  ];
}

function assignResearchPasses(
  audit: CandidateAudit[],
  passSizes: number[],
): Selection["research_passes"] {
  let offset = 0;
  let cumulative = 0;
  return passSizes.map((size, index) => {
    const pass = index + 1;
    for (const row of audit.slice(offset, offset + size)) row.research_pass = pass;
    offset += size;
    cumulative += size;
    return {
      pass,
      candidates_added: size,
      cumulative_unique_candidates: cumulative,
      sources_checked: index === 0 ? ["douyin", "weibo"] : ["xiaohongshu", "bilibili"],
    };
  });
}

function editorialDay(items: MemeItem[], passSizes: number[]): DailyEnvelope {
  const day = selectedDay(firstDate, "strict_24h", items);
  const candidateCount = passSizes.reduce((sum, size) => sum + size, 0);
  const audit = auditForCandidateCount(firstDate, items, candidateCount);
  day.policy_version = MEME_EDITORIAL_POLICY_VERSION;
  day.run_report.candidates_scanned = candidateCount;
  day.run_report.dropped_low_confidence = candidateCount - items.length;
  day.run_report.evidence_summary.candidates_with_urls = candidateCount;
  day.run_report.selection!.candidate_audit = audit;
  day.run_report.selection!.editorial_complete = true;
  day.run_report.selection!.research_passes = assignResearchPasses(audit, passSizes);
  return day;
}

function strictItems(count: number, prefix: string): MemeItem[] {
  return Array.from({ length: count }, (_, index) =>
    scoredItem(
      firstDate,
      `${firstDate}-strict-${index + 1}`,
      `${prefix}表达${index + 1}`,
      `${firstDate}T07:00:00+08:00`,
    ),
  );
}

function fullyRecurringBoardIssues(): string[] {
  const firstItems = ["还在升温甲", "还在升温乙", "还在升温丙"].map(
    (title, index) =>
      scoredItem(
        firstDate,
        `${firstDate}-active-${index + 1}`,
        title,
        `${firstDate}T07:00:00+08:00`,
      ),
  );
  const secondItems = firstItems.map((item) =>
    scoredItem(
      secondDate,
      item.id,
      item.title,
      `${secondDate}T07:00:00+08:00`,
      2,
    ),
  );
  return dynamicSelectionIssues([
    selectedDay(firstDate, "strict_24h", firstItems),
    selectedDay(secondDate, "strict_24h", secondItems),
  ]);
}

function recurrenceIssues(
  id: string,
  title: string,
  canonical: string,
  daysOnList: number,
  observedAt: string,
  aliases: string[] = [],
): string[] {
  const first = scoredItem(
    firstDate,
    `${firstDate}-stable`,
    "稳定身份",
    `${firstDate}T07:00:00+08:00`,
  );
  const repeated = scoredItem(secondDate, id, title, observedAt, daysOnList);
  repeated.canonical_phrase = canonical;
  repeated.aliases = aliases;
  return dynamicSelectionIssues([
    selectedDay(firstDate, "strict_24h", [first]),
    selectedDay(secondDate, "strict_24h", [repeated]),
  ]);
}

function longGapRecurrenceIssues(): string[] {
  const laterDate = "2026-08-20";
  const first = scoredItem(
    firstDate,
    `${firstDate}-second-wave`,
    "二次升温",
    `${firstDate}T07:00:00+08:00`,
  );
  const repeated = scoredItem(
    laterDate,
    first.id,
    first.title,
    `${laterDate}T07:00:00+08:00`,
    2,
  );
  return dynamicSelectionIssues([
    selectedDay(firstDate, "strict_24h", [first]),
    selectedDay(laterDate, "strict_24h", [repeated]),
  ]);
}

function scoreTierAccepted(tier: SelectionTier, total: number): boolean {
  const scoreBreakdown = {
    heat: total - 45,
    freshness: 22,
    reusability: 16,
    evidence: 7,
  };
  const item = scoredItem(
    firstDate,
    `${firstDate}-${tier}`,
    `评分${tier}`,
    `${firstDate}T07:00:00+08:00`,
    1,
    scoreBreakdown,
  );
  return dynamicSelectionIssues([selectedDay(firstDate, tier, [item])]).length === 0;
}

function originOnlyIssues(): string[] {
  const item = scoredItem(
    firstDate,
    `${firstDate}-origin-only`,
    "只有出处",
    `${firstDate}T07:00:00+08:00`,
  );
  const day = selectedDay(firstDate, "strict_24h", [item]);
  item.sources = item.sources.map((source) => ({
    ...source,
    evidence_role: "origin",
  }));
  return dynamicSelectionIssues([day]);
}

function futureObservationIssues(): string[] {
  const item = scoredItem(
    firstDate,
    `${firstDate}-future-observation`,
    "活动时间",
    `${firstDate}T07:45:00+08:00`,
  );
  return dynamicSelectionIssues([selectedDay(firstDate, "strict_24h", [item])]);
}

function unjustifiedRelaxationIssues(): string[] {
  const items = ["严格甲", "严格乙", "严格丙"].map((title, index) =>
    scoredItem(
      firstDate,
      `${firstDate}-strict-${index + 1}`,
      title,
      `${firstDate}T07:00:00+08:00`,
    ),
  );
  return dynamicSelectionIssues([selectedDay(firstDate, "relaxed_72h", items)]);
}

function heldReexposureIssues(): string[] {
  const heldItem = scoredItem(
    firstDate,
    `${firstDate}-held`,
    "人工下架梗",
    `${firstDate}T07:00:00+08:00`,
  );
  const held = selectedDay(firstDate, "strict_24h", [heldItem]);
  held.status = "held";
  held.run_report.published = 0;
  const reexposed = scoredItem(
    secondDate,
    `${secondDate}-reexposed`,
    heldItem.title,
    `${secondDate}T07:00:00+08:00`,
  );
  return dynamicSelectionIssues([
    held,
    selectedDay(secondDate, "strict_24h", [reexposed]),
  ]);
}

function validRelaxed48Day(): DailyEnvelope {
  const scoreBreakdown = {
    heat: 25,
    freshness: 22,
    reusability: 16,
    evidence: 7,
  };
  const items = ["放宽甲", "放宽乙", "放宽丙"].map((title, index) =>
    scoredItem(
      firstDate,
      `${firstDate}-relaxed-${index + 1}`,
      title,
      `${firstDate}T06:30:00+08:00`,
      1,
      scoreBreakdown,
    ),
  );
  return selectedDay(firstDate, "relaxed_48h", items);
}

function legacyCompatibilityIssues(): string[] {
  const legacyDate = "2026-07-26";
  const item = scoredItem(
    legacyDate,
    `${legacyDate}-legacy`,
    "历史梗",
    `${legacyDate}T07:00:00+08:00`,
  );
  const legacy = selectedDay(legacyDate, "strict_24h", [item]);
  delete legacy.run_report.selection;
  delete legacy.run_report.dropped_capacity;
  delete item.canonical_phrase;
  delete item.score_breakdown;
  for (const source of item.sources) delete source.observed_at;
  return dynamicSelectionIssues([legacy]);
}

function highCapacityAuditRow(): CandidateAudit {
  return {
    candidate_key: "candidate-20",
    canonical_phrase: "候选表达20",
    outcome: "dropped_capacity",
    score: 90,
    score_breakdown: { heat: 37, freshness: 27, reusability: 18, evidence: 8 },
    activity: {
      evidence_role: "popularity",
      url: `https://example.com/${firstDate}/candidate-20`,
      observed_at: `${firstDate}T07:00:00+08:00`,
    },
  };
}

function hotterCapacityIssues(): string[] {
  const items = Array.from({ length: 10 }, (_, index) =>
    scoredItem(
      firstDate,
      `${firstDate}-selected-${index + 1}`,
      `已选表达${index + 1}`,
      `${firstDate}T07:00:00+08:00`,
    ),
  );
  const day = selectedDay(firstDate, "strict_24h", items);
  day.run_report.dropped_low_confidence = 19;
  day.run_report.dropped_capacity = 1;
  day.run_report.selection!.qualified = {
    strict_24h: 11,
    relaxed_48h: 11,
    relaxed_72h: 11,
  };
  day.run_report.selection!.candidate_audit[29] = highCapacityAuditRow();
  return dynamicSelectionIssues([day]);
}

describe("dynamic selection cross-day eligibility", () => {
  it("allows a whole recurring board when every item has new activity", () => {
    expect(fullyRecurringBoardIssues()).toHaveLength(0);
  });

  it("rejects activity that predates the last site publication", () => {
    const issues = recurrenceIssues(
      `${firstDate}-stable`,
      "稳定身份",
      "稳定身份",
      2,
      `${firstDate}T07:30:00+08:00`,
    );
    expect(issues.some((issue) => issue.includes("post-publication activity"))).toBe(true);
  });

  it("rejects changing the original id", () => {
    const issues = recurrenceIssues(
      `${secondDate}-renamed`,
      "稳定身份",
      "稳定身份",
      2,
      `${secondDate}T07:00:00+08:00`,
    );
    expect(issues.some((issue) => issue.includes(`retain id ${firstDate}-stable`))).toBe(true);
  });
});

describe("dynamic selection stable identity", () => {
  it("rejects reusing an id for a different canonical phrase", () => {
    const issues = recurrenceIssues(
      `${firstDate}-stable`,
      "完全不同乙梗",
      "完全不同乙梗",
      2,
      `${secondDate}T07:00:00+08:00`,
    );
    expect(issues.some((issue) => issue.includes("canonical_phrase does not match"))).toBe(true);
  });

  it("rejects an incorrect visible-appearance count", () => {
    const issues = recurrenceIssues(
      `${firstDate}-stable`,
      "稳定身份",
      "稳定身份",
      1,
      `${secondDate}T07:00:00+08:00`,
    );
    expect(issues.some((issue) => issue.includes("days_on_list must be 2"))).toBe(true);
  });

  it("does not automatically re-expose an operator-held identity", () => {
    const issues = heldReexposureIssues();
    expect(issues.some((issue) => issue.includes("operator-held identity"))).toBe(true);
  });
});

describe("dynamic selection binds display text to canonical identity", () => {
  it("rejects unrelated display text even when old canonical is retained", () => {
    const issues = recurrenceIssues(
      `${firstDate}-stable`,
      "完全无关的新标题",
      "稳定身份",
      2,
      `${secondDate}T07:00:00+08:00`,
    );
    expect(issues.some((issue) => issue.includes("must anchor canonical_phrase"))).toBe(true);
  });

  it("rejects a canonical phrase that normalizes to empty", () => {
    const issues = recurrenceIssues(
      `${firstDate}-stable`,
      "!!!",
      "!!!",
      2,
      `${secondDate}T07:00:00+08:00`,
    );
    expect(issues.some((issue) => issue.includes("no stable letters"))).toBe(true);
  });
});

describe("dynamic selection allows identity-anchored display evolution", () => {
  it("allows display rewording when an alias anchors the stable phrase", () => {
    const issues = recurrenceIssues(
      `${firstDate}-stable`,
      "🔥 稳定身份继续升温",
      "稳定身份",
      2,
      `${secondDate}T07:00:00+08:00`,
      ["稳定身份"],
    );
    expect(issues).toHaveLength(0);
  });
});

describe("dynamic selection supports genuine long-gap second waves", () => {
  it("retains the first id and count without a calendar-age cap", () => {
    expect(longGapRecurrenceIssues()).toHaveLength(0);
  });
});

describe("dynamic selection score and activity clocks", () => {
  it.each([
    ["strict_24h", 74, false],
    ["relaxed_48h", 70, true],
    ["relaxed_72h", 65, true],
  ] as const)("applies the %s score floor of %i", (tier, total, accepted) => {
    expect(scoreTierAccepted(tier, total)).toBe(accepted);
  });

  it("rejects observed activity later than capture", () => {
    expect(futureObservationIssues().some((issue) =>
      issue.includes("observed_at is after captured_at"),
    )).toBe(true);
  });

  it("does not treat an origin timestamp as popularity activity", () => {
    expect(originOnlyIssues().some((issue) =>
      issue.includes("no observed_at evidence"),
    )).toBe(true);
  });
});

describe("dynamic selection pool accounting and tier progression", () => {
  it("requires at least 30 ranked candidates", () => {
    const item = scoredItem(
      firstDate,
      `${firstDate}-small-pool`,
      "候选池",
      `${firstDate}T07:00:00+08:00`,
    );
    const day = selectedDay(firstDate, "strict_24h", [item]);
    day.run_report.candidates_scanned = 29;
    day.run_report.dropped_low_confidence = 28;
    expect(dynamicSelectionIssues([day])[0]).toContain("expected >=30");
  });
});

describe("dynamic selection evidence-drop accounting", () => {
  it("includes evidence drops in honest candidate accounting", () => {
    const item = scoredItem(
      firstDate,
      `${firstDate}-evidence-drop`,
      "证据丢弃",
      `${firstDate}T07:00:00+08:00`,
    );
    const day = selectedDay(firstDate, "strict_24h", [item]);
    day.run_report.dropped_low_confidence = 28;
    day.run_report.evidence_summary.dropped_insufficient_evidence = 1;
    day.run_report.selection!.candidate_audit[29] = {
      candidate_key: "candidate-29",
      canonical_phrase: "候选表达29",
      outcome: "dropped_insufficient_evidence",
    };
    expect(dynamicSelectionIssues([day])).toHaveLength(0);
  });
});

describe("dynamic selection outcome accounting", () => {
  it("rejects candidate outcomes that do not add up", () => {
    const item = scoredItem(
      firstDate,
      `${firstDate}-accounting-gap`,
      "候选漏记",
      `${firstDate}T07:00:00+08:00`,
    );
    const day = selectedDay(firstDate, "strict_24h", [item]);
    day.run_report.dropped_low_confidence = 0;
    expect(dynamicSelectionIssues([day]).some((issue) =>
      issue.includes("dropped_low_confidence audit count"),
    )).toBe(true);
  });
});

describe("dynamic selection safety-audit privacy", () => {
  it("rejects content-derived safety keys and private candidate details", () => {
    const item = scoredItem(
      firstDate,
      `${firstDate}-privacy`,
      "安全审计",
      `${firstDate}T07:00:00+08:00`,
    );
    const day = selectedDay(firstDate, "strict_24h", [item]);
    day.run_report.dropped_low_confidence = 28;
    day.run_report.dropped_safety = { privacy: 1 };
    day.run_report.selection!.candidate_audit[29] = {
      candidate_key: "rejected-private-subject",
      canonical_phrase: "不应进入公开仓库的内容",
      outcome: "dropped_safety",
      score: 90,
      score_breakdown: defaultScore,
      activity: {
        evidence_role: "popularity",
        url: "https://example.com/private-subject",
        observed_at: `${firstDate}T07:00:00+08:00`,
      },
      drop_reason: "privacy",
    };
    const issues = dynamicSelectionIssues([day]);
    expect(issues.some((issue) => issue.includes("key must be opaque"))).toBe(true);
    expect(issues.some((issue) => issue.includes("must omit private details"))).toBe(true);
  });
});

describe("dynamic selection minimal safety-audit shape", () => {
  it("accepts an opaque safety counter with only its primary category", () => {
    const item = scoredItem(
      firstDate,
      `${firstDate}-opaque-safety`,
      "匿名安全审计",
      `${firstDate}T07:00:00+08:00`,
    );
    const day = selectedDay(firstDate, "strict_24h", [item]);
    day.run_report.dropped_low_confidence = 28;
    day.run_report.dropped_safety = { privacy: 1 };
    day.run_report.selection!.candidate_audit[29] = {
      candidate_key: "candidate-29",
      outcome: "dropped_safety",
      drop_reason: "privacy",
    };
    expect(dynamicSelectionIssues([day])).toHaveLength(0);
  });
});

describe("dynamic selection cannot skip a stricter usable tier", () => {
  it("rejects relaxed_72h when three selected items clear strict_24h", () => {
    const issues = unjustifiedRelaxationIssues();
    expect(issues.some((issue) =>
      issue.includes("stricter tier has at least 3"),
    )).toBe(true);
  });

  it("rejects non-monotonic reported qualification counts", () => {
    const item = scoredItem(
      firstDate,
      `${firstDate}-bad-counts`,
      "分层计数",
      `${firstDate}T07:00:00+08:00`,
    );
    const day = selectedDay(firstDate, "strict_24h", [item]);
    day.run_report.selection!.qualified = {
      strict_24h: 2,
      relaxed_48h: 1,
      relaxed_72h: 3,
    };
    const issues = dynamicSelectionIssues([day]);
    expect(issues.some((issue) => issue.includes("qualified audit count"))).toBe(true);
  });
});

describe("dynamic selection contract boundaries", () => {
  it("accepts a valid three-item relaxed_48h progression", () => {
    expect(dynamicSelectionIssues([validRelaxed48Day()])).toHaveLength(0);
  });

  it("rejects a tier/status mismatch", () => {
    const day = validRelaxed48Day();
    day.status = "published";
    expect(dynamicSelectionIssues([day]).some((issue) =>
      issue.includes("requires status partial"),
    )).toBe(true);
  });

  it("rejects score totals that disagree with the breakdown", () => {
    const day = validRelaxed48Day();
    day.items[0]!.score = 99;
    expect(dynamicSelectionIssues([day]).some((issue) =>
      issue.includes("does not equal"),
    )).toBe(true);
  });

  it("keeps pre-cutoff envelopes backward compatible", () => {
    expect(legacyCompatibilityIssues()).toHaveLength(0);
  });
});

describe("dynamic selection keeps the highest-scoring qualified candidates", () => {
  it("rejects dropping a hotter candidate for capacity", () => {
    const issues = hotterCapacityIssues();
    expect(issues.some((issue) => issue.includes("not the top-scoring"))).toBe(true);
  });
});

describe("v4 editorial completeness search depth", () => {
  it("accepts one complete 30-candidate pass when more than three qualify", () => {
    const day = DailyEnvelopeSchema.parse(editorialDay(strictItems(4, "完整研究"), [30]));
    expect(dynamicSelectionIssues([day])).toHaveLength(0);
  });
  it("requires a second pass and 45 unique candidates when exactly three qualify", () => {
    const day = editorialDay(strictItems(3, "仅三条"), [30]);
    const issues = dynamicSelectionIssues([day]);
    expect(issues.some((issue) => issue.includes("require a second research pass"))).toBe(true);
    expect(issues.some((issue) => issue.includes("require >=45 unique candidates"))).toBe(true);
  });
  it("accepts exactly three after a reconciled 30 plus 15 candidate search", () => {
    const day = editorialDay(strictItems(3, "充分三条"), [30, 15]);
    expect(dynamicSelectionIssues([day])).toHaveLength(0);
  });
  it("keeps v3 post-cutoff envelopes compatible without v4 research fields", () => {
    const day = selectedDay(firstDate, "strict_24h", strictItems(4, "旧版"));
    day.policy_version = "v3-dynamic-selection";
    expect(dynamicSelectionIssues([day])).toHaveLength(0);
  });
});

describe("v4 editorial completeness accounting", () => {
  it("rejects a false editorial_complete declaration", () => {
    const day = editorialDay(strictItems(4, "未完成"), [30]);
    day.run_report.selection!.editorial_complete = false;
    const issues = dynamicSelectionIssues([day]);
    expect(issues.some((issue) => issue.includes("requires editorial_complete=true"))).toBe(true);
  });
  it("reconciles pass membership and cumulative candidate totals", () => {
    const day = editorialDay(strictItems(3, "账本核对"), [30, 15]);
    day.run_report.selection!.candidate_audit[44]!.research_pass = 1;
    day.run_report.selection!.research_passes![1]!.cumulative_unique_candidates = 44;
    const issues = dynamicSelectionIssues([day]);
    expect(issues.some((issue) => issue.includes("research pass 1 candidates_added"))).toBe(true);
    expect(issues.some((issue) => issue.includes("research pass 2 cumulative"))).toBe(true);
    expect(issues.some((issue) => issue.includes("research final vs candidates_scanned"))).toBe(true);
  });
  it("does not allow a qualifying fourth candidate to be hidden as low confidence", () => {
    const day = editorialDay(strictItems(3, "不可截断"), [30, 15]);
    const hidden = day.run_report.selection!.candidate_audit[44]!;
    hidden.score = 83;
    hidden.score_breakdown = defaultScore;
    const issues = dynamicSelectionIssues([day]);
    expect(issues.some((issue) => issue.includes("selected qualified"))).toBe(true);
    expect(issues.some((issue) => issue.includes("outcome does not match"))).toBe(true);
  });
});
