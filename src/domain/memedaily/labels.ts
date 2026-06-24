/**
 * input: domain enum values
 * output: Chinese display labels and ordering helpers
 * pos: UI-safe mapping layer with no filesystem or rendering side effects
 */
import type { MemeItem } from "./schema";

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

export function sortByDecisionValue<T extends MemeItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const byLife = lifecycleRank[a.lifecycle] - lifecycleRank[b.lifecycle];
    // Unscored items use a neutral midpoint so absence of a score does not
    // silently sink an otherwise valuable meme to the bottom of its bucket.
    return byLife || (b.score ?? 50) - (a.score ?? 50);
  });
}

// 热度值：综合分高者优先（缺分用中位数 50），同分再按生命周期。
export function sortByHeat<T extends MemeItem>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      (b.score ?? 50) - (a.score ?? 50) ||
      lifecycleRank[a.lifecycle] - lifecycleRank[b.lifecycle],
  );
}

// 新鲜值：刚起势优先，再按上榜天数（越少越新），最后按分数。
export function sortByFreshness<T extends MemeItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const byLife = lifecycleRank[a.lifecycle] - lifecycleRank[b.lifecycle];
    if (byLife) return byLife;
    const byDays = (a.days_on_list ?? 1) - (b.days_on_list ?? 1);
    return byDays || (b.score ?? 50) - (a.score ?? 50);
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
export function sortByDateThenLife<T extends MemeItem & { date: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      archiveLifecycleRank[a.lifecycle] - archiveLifecycleRank[b.lifecycle] ||
      (b.score ?? 50) - (a.score ?? 50),
  );
}

export const feedSortLabels = {
  heat: "热度值",
  fresh: "新鲜值",
} as const;

export type FeedSort = keyof typeof feedSortLabels;
