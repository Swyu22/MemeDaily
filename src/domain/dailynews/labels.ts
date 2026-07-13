/**
 * input: dailynews enum values
 * output: Chinese display labels and ordering helper for the 日报 feed
 * pos: UI-safe mapping layer with no filesystem or rendering side effects
 */

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

// 新鲜值排序：按新闻**真实发生/披露时间**（occurred_at）离现在的远近——越接近现在越靠前。
// occurred_at 缺失时回退到该条最新的 source.captured_at（抓取时刻）兜底；时间相同再以热度兜底，
// 保证结果稳定。注意：这里用的是事件时间，不是抓取时间。
export function sortNewsByFreshness<
  T extends { heat_rank: number; occurred_at?: string; sources: { captured_at: string }[] },
>(items: T[]): T[] {
  const eventTime = (item: T) => {
    if (item.occurred_at) return Date.parse(item.occurred_at);
    return item.sources.reduce((newest, source) => Math.max(newest, Date.parse(source.captured_at)), 0);
  };
  return [...items].sort((a, b) => {
    const diff = eventTime(b) - eventTime(a); // 发生时间更新（更靠近现在）的在前
    return diff !== 0 ? diff : a.heat_rank - b.heat_rank;
  });
}
