/**
 * input: today's visible 日报 news (or null)
 * output: the 日报 tab body — heat-ranked news cards, fixed editorial order
 * pos: feature UI for the 日报 feed; rendered by HomeTabs
 */
import { sortByHeatRank } from "@/domain/dailynews/labels";
import type { PublicNewsItem } from "@/domain/dailynews/schema";
import { NewsCard } from "./NewsCard";

type DailyReportProps = {
  news: { date: string; items: PublicNewsItem[] } | null;
};

export function DailyReport({ news }: DailyReportProps) {
  if (!news || news.items.length === 0) {
    return (
      <div className="empty">
        今天还没有日报内容。日报宁缺毋滥——达标几条发几条，没有合格内容就不发。
      </div>
    );
  }

  const items = sortByHeatRank(news.items);

  return (
    <div className="day-list">
      <section className="day-section">
        <div className="day-head">
          <div>
            <h1>今日日报</h1>
            <p className="summary">
              {news.date} · {items.length} 条 · 按热度排序
            </p>
          </div>
        </div>
        <div className="stack">
          {items.map((item) => (
            <NewsCard item={item} key={item.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
