/**
 * input: domain enum values
 * output: Chinese display labels and ordering helpers
 * pos: UI-safe mapping layer with no filesystem or rendering side effects
 */
import type { MemeItem } from "./schema";

type SortableMeme = Pick<
  MemeItem,
  "days_on_list" | "lifecycle" | "score" | "score_breakdown"
>;

export const lifecycleLabels = {
  rising: "还能上车",
  peak: "正热",
  declining: "已过气",
} as const;

export const lifecycleRank = {
  rising: 0,
  peak: 1,
  declining: 2,
} as const;

export const statusLabels = {
  published: "已发布",
  partial: "部分发布",
  skipped: "跳过",
  held: "暂存",
} as const;

export const platformLabels = {
  weibo: "微博",
  douyin: "抖音",
  xiaohongshu: "小红书",
  bilibili: "B站",
  zhihu: "知乎",
  wechat: "微信",
  other: "其他",
} as const;

export const tierLabels = {
  platform_public: "平台公开页",
  aggregator: "公开榜单",
  search_media: "搜索/媒体",
  spillover: "外溢讨论",
} as const;

function decisionScore(item: SortableMeme): number {
  if (item.score === undefined) return 50;
  return item.score;
}

export function sortByDecisionValue<T extends SortableMeme>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const byLife = lifecycleRank[a.lifecycle] - lifecycleRank[b.lifecycle];
    // Unscored items use a neutral midpoint so absence of a score does not
    // silently sink an otherwise valuable meme to the bottom of its bucket.
    return byLife || decisionScore(b) - decisionScore(a);
  });
}

function heatValue(item: SortableMeme): number {
  if (item.score_breakdown) return item.score_breakdown.heat;
  return item.score ?? 50;
}

function freshnessValue(item: SortableMeme): number {
  if (item.score_breakdown) return item.score_breakdown.freshness;
  return -1;
}

function daysValue(item: SortableMeme): number {
  if (item.days_on_list === undefined) return 1;
  return item.days_on_list;
}

// 热度值：新契约按 heat 分量，历史数据回退综合分；同分再按生命周期。
export function sortByHeat<T extends SortableMeme>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      heatValue(b) - heatValue(a) ||
      decisionScore(b) - decisionScore(a) ||
      lifecycleRank[a.lifecycle] - lifecycleRank[b.lifecycle],
  );
}

// 新鲜值：新契约按 freshness 分量；历史数据回退生命周期/上榜天数。
export function sortByFreshness<T extends SortableMeme>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const byFreshness = freshnessValue(b) - freshnessValue(a);
    if (byFreshness) return byFreshness;
    const byLife = lifecycleRank[a.lifecycle] - lifecycleRank[b.lifecycle];
    if (byLife) return byLife;
    const byDays = daysValue(a) - daysValue(b);
    if (byDays) return byDays;
    return decisionScore(b) - decisionScore(a);
  });
}

// Archive ordering: 正热(peak) before 还能上车(rising) before 已过气(declining).
// (The home feed's `lifecycleRank` is rising-first for "freshness"; the 梗库 wants peak-first.)
const archiveLifecycleRank = {
  peak: 0,
  rising: 1,
  declining: 2,
} as const;

// 梗库主排序：日期(近→远) → 生命周期(正热>还能上车>已过气) → 热度值(score)。
export function sortByDateThenLife<T extends SortableMeme & { date: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      archiveLifecycleRank[a.lifecycle] - archiveLifecycleRank[b.lifecycle] ||
      decisionScore(b) - decisionScore(a),
  );
}

export const feedSortLabels = {
  heat: "热度值",
  fresh: "新鲜值",
} as const;

export type FeedSort = keyof typeof feedSortLabels;
