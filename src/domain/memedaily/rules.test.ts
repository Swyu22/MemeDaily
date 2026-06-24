import { describe, expect, it } from "vitest";
import type { DailyEnvelope, MemeItem } from "./schema";
import { MemeItemSchema } from "./schema";
import {
  crossDayIssues,
  dedupeRecurring,
  envelopeIssueSummary,
  hasPublishableEvidence,
  lifecycleIssues,
  visibleItems,
} from "./rules";

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

  it("treats a partial envelope as visible like published", () => {
    expect(visibleItems(envelopeWith(baseItem, "partial"))).toHaveLength(1);
  });

  it("flags two items that are the same meme on the same day", () => {
    const envelope = envelopeWith(baseItem, "published");
    envelope.items = [baseItem, { ...baseItem, id: "2026-06-20-banwei-dup" }];
    envelope.run_report.published = 2;

    expect(envelopeIssueSummary(envelope).some((issue) => issue.includes("duplicates"))).toBe(
      true,
    );
  });

  it("flags a published envelope with zero items", () => {
    const envelope = envelopeWith(baseItem, "published");
    envelope.items = [];
    envelope.run_report.published = 0;

    expect(envelopeIssueSummary(envelope)).toContain("published envelope cannot have zero items");
  });

  it("flags an item that lacks publishable evidence", () => {
    const weak = {
      ...baseItem,
      sources: baseItem.sources.map((source) => ({ ...source, tier: "search_media" as const })),
    } satisfies MemeItem;
    const envelope = envelopeWith(weak, "published");
    envelope.run_report.published = 0;

    expect(envelopeIssueSummary(envelope)).toContain(`${weak.id} lacks publishable evidence`);
  });

  it("hides an item flagged published:false", () => {
    const hidden = { ...baseItem, published: false } satisfies MemeItem;
    expect(visibleItems(envelopeWith(hidden, "published"))).toHaveLength(0);
  });

  it("flags a source captured after the envelope was generated", () => {
    const envelope = envelopeWith(baseItem, "published");
    envelope.generated_at = "2026-06-20T07:00:00+08:00"; // before the sources' 07:15/07:16

    expect(
      envelopeIssueSummary(envelope).some((issue) => issue.includes("after generated_at")),
    ).toBe(true);
  });

  it("flags an item whose subject is politics (首相)", () => {
    const political = { ...baseItem, summary: "铁打的拉里，流水的英国首相，网友这么调侃。" } satisfies MemeItem;
    expect(
      envelopeIssueSummary(envelopeWith(political, "published")).some((i) =>
        i.includes("political term"),
      ),
    ).toBe(true);
  });

  it("does NOT flag a non-political meme that only mentions a parliament in passing", () => {
    const ok = {
      ...baseItem,
      summary: "维京划船蔓延到议会大厅、商场扶梯，全员一起划起来了。",
    } satisfies MemeItem;
    expect(
      envelopeIssueSummary(envelopeWith(ok, "published")).some((i) => i.includes("political term")),
    ).toBe(false);
  });
});

describe("MemeDaily cross-day freshness", () => {
  function dayWith(date: string, item: MemeItem): DailyEnvelope {
    return { ...envelopeWith(item, "published"), date };
  }

  it("flags a meme that recurs without days_on_list >= 2", () => {
    const day1 = dayWith("2026-06-19", { ...baseItem, id: "2026-06-19-banwei" });
    const day2 = dayWith("2026-06-20", { ...baseItem, id: "2026-06-20-banwei" });

    expect(crossDayIssues([day2, day1]).length).toBeGreaterThan(0);
  });

  it("accepts a recurring meme that increments days_on_list", () => {
    const day1 = dayWith("2026-06-19", { ...baseItem, id: "2026-06-19-banwei" });
    const day2 = dayWith("2026-06-20", {
      ...baseItem,
      id: "2026-06-20-banwei",
      days_on_list: 2,
    });

    expect(crossDayIssues([day1, day2])).toHaveLength(0);
  });

  it("does not flag distinct memes on different days", () => {
    const day1 = dayWith("2026-06-19", { ...baseItem, id: "2026-06-19-banwei" });
    const day2 = dayWith("2026-06-20", {
      ...baseItem,
      id: "2026-06-20-gongzhu",
      title: "公主请上车",
      aliases: [],
    });

    expect(crossDayIssues([day1, day2])).toHaveLength(0);
  });
});

describe("MemeDaily lifecycle 10-day rule", () => {
  function dayWith(date: string, item: MemeItem): DailyEnvelope {
    return { ...envelopeWith(item, "published"), date };
  }

  it("flags a declining meme younger than 10 days", () => {
    const env = dayWith("2026-06-21", { ...baseItem, lifecycle: "declining" });
    expect(lifecycleIssues([env]).length).toBeGreaterThan(0);
  });

  it("accepts a declining meme first seen 10+ days ago", () => {
    const day1 = dayWith("2026-06-01", { ...baseItem, id: "2026-06-01-banwei" });
    const day2 = dayWith("2026-06-21", {
      ...baseItem,
      id: "2026-06-21-banwei",
      lifecycle: "declining",
      days_on_list: 2,
    });
    expect(lifecycleIssues([day1, day2])).toHaveLength(0);
  });

  it("does not flag rising or peak", () => {
    const rising = dayWith("2026-06-21", { ...baseItem, lifecycle: "rising" });
    const peak = dayWith("2026-06-21", { ...baseItem, lifecycle: "peak" });
    expect(lifecycleIssues([rising])).toHaveLength(0);
    expect(lifecycleIssues([peak])).toHaveLength(0);
  });
});

describe("MemeDaily schema gates", () => {
  it("rejects a title longer than 48 chars", () => {
    const result = MemeItemSchema.safeParse({ ...baseItem, title: "梗".repeat(49) });
    expect(result.success).toBe(false);
  });

  it("accepts the optional source.title field", () => {
    const result = MemeItemSchema.safeParse({
      ...baseItem,
      sources: baseItem.sources.map((source) => ({ ...source, title: "公开话题页·班味" })),
    });
    expect(result.success).toBe(true);
  });
});

describe("MemeDaily archive dedup", () => {
  it("keeps a recurring meme once, preferring the first (most recent) row", () => {
    const recent = { ...baseItem, id: "2026-06-21-banwei", date: "2026-06-21" };
    const older = { ...baseItem, id: "2026-06-19-banwei", date: "2026-06-19" };
    const out = dedupeRecurring([recent, older]); // caller passes date-desc
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe("2026-06-21-banwei");
  });

  it("does not merge two genuinely different memes", () => {
    const a = { ...baseItem, id: "2026-06-21-banwei", date: "2026-06-21" };
    const b = { ...baseItem, id: "2026-06-21-gongzhu", title: "公主请上车", aliases: [], date: "2026-06-21" };
    expect(dedupeRecurring([a, b])).toHaveLength(2);
  });

  it("merges a recurrence that kept its id but reworded its title", () => {
    const recent = { ...baseItem, id: "2026-06-22-x", title: "失业还没来得及商务已追上", aliases: [], date: "2026-06-23" };
    const older = { ...baseItem, id: "2026-06-22-x", title: "还没失业商务先到了", aliases: [], date: "2026-06-22" };
    const out = dedupeRecurring([recent, older]);
    expect(out).toHaveLength(1);
    expect(out[0]?.date).toBe("2026-06-23");
  });
});
