/**
 * input: synthetic newest-first feed runs and visible-day metadata
 * output: regression assertions that home status reflects the latest run, including skipped days
 * pos: app-composition contract test for dual-feed status and stale-content notices
 */
import { describe, expect, it } from "vitest";
import { homeRunState } from "./homeRunState";

const labels = {
  published: "已发布",
  partial: "部分发布",
  skipped: "跳过",
  held: "暂存",
} as const;

describe("homeRunState", () => {
  it("reports the latest skipped run instead of substituting an older visible day", () => {
    const runs = [
      { date: "2026-07-14", generated_at: "2026-07-14T07:15:00+08:00", status: "skipped" as const },
      { date: "2026-07-13", generated_at: "2026-07-13T07:15:00+08:00", status: "published" as const },
    ];

    const state = homeRunState(runs, "2026-07-13", 0, labels, "日报");

    expect(state.status).toMatchObject({ date: "2026-07-14", statusLabel: "跳过", count: 0 });
    expect(state.freshDate).toBeNull();
    expect(state.notice).toContain("下方展示的是最近一次有内容的发布");
  });

  it("marks a visible partial run as fresh and explains the reduced count", () => {
    const runs = [
      { date: "2026-07-14", generated_at: "2026-07-14T06:20:00+08:00", status: "partial" as const },
    ];

    const state = homeRunState(runs, "2026-07-14", 3, labels, "日报");

    expect(state.freshDate).toBe("2026-07-14");
    expect(state.status).toMatchObject({ statusLabel: "部分发布", count: 3 });
    expect(state.notice).toContain("部分发布");
  });
});
