/**
 * input: up to N recent 日报 days (each pre-filtered to visible items) + the active sort
 * output: the 日报 tab body — day-grouped news cards; day 0's heading is the lifted 大标题
 *         (shown above the tabs by HomeTabs), so day 0 renders bare and older days keep a date head
 * pos: feature UI for the 日报 feed; mirrors the meme TodayFeed's multi-day layout
 */
import { sortByHeatRank, sortNewsByFreshness } from "@/domain/dailynews/labels";
import type { PublicNewsItem } from "@/domain/dailynews/schema";
import { feedSortLabels, type FeedSort } from "@/domain/memedaily/labels";
import { NewsCard } from "./NewsCard";

type DailyReportProps = {
  days: { date: string; items: PublicNewsItem[] }[];
  sort: FeedSort;
};

export function DailyReport({ days, sort }: DailyReportProps) {
  if (days.length === 0) {
    return (
      <div className="empty">
        今天还没有日报内容。日报宁缺毋滥——达标几条发几条，没有合格内容就不发。
      </div>
    );
  }

  return (
    <div className="day-list">
      {days.map((day, dayIndex) => {
        // Day 0's heading is the lifted 大标题/副标题 above the tabs, so render its cards bare.
        const lifted = dayIndex === 0;
        const items =
          sort === "fresh" ? sortNewsByFreshness(day.items) : sortByHeatRank(day.items);
        return (
          <section className="day-section" key={day.date}>
            {lifted ? null : (
              <div className="day-head">
                <div>
                  <h2>{day.date}</h2>
                  <p className="summary">{day.items.length} 条</p>
                </div>
                <span className="mini">按{feedSortLabels[sort]}排序</span>
              </div>
            )}
            <div className="stack">
              {items.map((item) => (
                <NewsCard item={item} key={item.id} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
