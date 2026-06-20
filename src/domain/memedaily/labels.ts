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
