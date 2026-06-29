/**
 * input: dailynews enum values
 * output: Chinese display labels and ordering helper for the 日报 feed
 * pos: UI-safe mapping layer with no filesystem or rendering side effects
 */

// Kept for reference / possible future use. NOTE: the category chip is no longer rendered in v2
// (it cluttered the card); category now only steers the agent's editorial mix.
export const categoryLabels = {
  民生社会: "民生社会",
  节日节气: "节日节气",
  国家高光: "国家高光",
  科技AI: "科技 · AI",
  科技向善: "科技向善",
  文化数字经济: "文化 · 数字经济",
} as const;

export const newsTierLabels = {
  official: "官方",
  state_media: "央媒",
  major_media: "主流媒体",
  aggregator: "热榜要闻",
} as const;

export const statusLabels = {
  published: "已发布",
  partial: "部分发布",
  skipped: "跳过",
  held: "暂存",
} as const;

// 热度值排序（默认）：heat_rank 升序（1 = 最热，置顶）。
export function sortByHeatRank<T extends { heat_rank: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.heat_rank - b.heat_rank);
}

// 新鲜值排序：离现在越近（来源捕获时间越新）越靠前——以每条最新的 source.captured_at 为时间锚，
// 降序排列；时间相同的以热度兜底，保证结果稳定。
export function sortNewsByFreshness<
  T extends { heat_rank: number; sources: { captured_at: string }[] },
>(items: T[]): T[] {
  const freshness = (item: T) =>
    item.sources.reduce((newest, source) => Math.max(newest, Date.parse(source.captured_at)), 0);
  return [...items].sort((a, b) => {
    const diff = freshness(b) - freshness(a); // 更新（更靠近今天）的在前
    return diff !== 0 ? diff : a.heat_rank - b.heat_rank;
  });
}
