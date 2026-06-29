/**
 * input: today's visible 日报 news (or null)
 * output: the 日报 tab body — heat-ranked news cards (the 大标题/副标题 are lifted to HomeTabs)
 * pos: feature UI for the 日报 feed; rendered by HomeTabs inside the tab panel
 */
import { sortByHeatRank, sortNewsByFreshness } from "@/domain/dailynews/labels";
import type { PublicNewsItem } from "@/domain/dailynews/schema";
import type { FeedSort } from "@/domain/memedaily/labels";
import { NewsCard } from "./NewsCard";

type DailyReportProps = {
  news: { date: string; items: PublicNewsItem[] } | null;
  sort: FeedSort;
};

export function DailyReport({ news, sort }: DailyReportProps) {
  if (!news || news.items.length === 0) {
    return (
      <div className="empty">
        今天还没有日报内容。日报宁缺毋滥——达标几条发几条，没有合格内容就不发。
      </div>
    );
  }

  const items = sort === "fresh" ? sortNewsByFreshness(news.items) : sortByHeatRank(news.items);

  return (
    <div className="stack">
      {items.map((item) => (
        <NewsCard item={item} key={item.id} />
      ))}
    </div>
  );
}
