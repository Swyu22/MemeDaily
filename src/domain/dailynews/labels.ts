/**
 * input: dailynews enum values
 * output: Chinese display labels and ordering helper for the 日报 feed
 * pos: UI-safe mapping layer with no filesystem or rendering side effects
 */

export const categoryLabels = {
  国家高光: "国家高光",
  节日节气: "节日节气",
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

// 日报顺序固定为编辑热度排序：heat_rank 升序（1 = 最热，置顶）。无读者侧切换。
export function sortByHeatRank<T extends { heat_rank: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.heat_rank - b.heat_rank);
}
