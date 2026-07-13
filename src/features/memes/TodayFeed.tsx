/**
 * input: prevalidated visible meme days (today + recent) + the active sort (owned by HomeTabs)
 * output: the meme day list — grouped by date, sorted; the FRESHEST day's heading is lifted to
 *         HomeTabs (shown above the tabs), so day 0 renders cards only; older days keep their head
 * pos: presentational body of the 热梗 tab; the sort toggle + toolbar now live in HomeTabs
 */
import Link from "next/link";
import { feedSortLabels, sortByFreshness, sortByHeat, type FeedSort } from "@/domain/memedaily/labels";
import type { MemeItem } from "@/domain/memedaily/schema";
import { MemeCard } from "./MemeCard";

type FeedDay = { date: string; items: MemeItem[] };

type TodayFeedProps = {
  days: FeedDay[];
  hasMore: boolean;
  sort: FeedSort;
};

export function TodayFeed({ days, hasMore, sort }: TodayFeedProps) {
  const sortFn = sort === "heat" ? sortByHeat : sortByFreshness;

  return (
    <div className="day-list">
      {days.map((day, dayIndex) => {
        // Day 0's heading is the lifted 大标题/副标题 above the tabs, so render its cards bare.
        const lifted = dayIndex === 0;
        return (
          <section className="day-section" key={day.date}>
            {lifted ? null : (
              <div className="day-head">
                <div>
                  <h2>{day.date}</h2>
                  <p className="summary">历史发布 · {day.items.length} 条</p>
                </div>
                <span className="mini">按{feedSortLabels[sort]}排序</span>
              </div>
            )}
            <div className="stack">
              {sortFn(day.items).map((item) => (
                <MemeCard item={item} key={item.id} />
              ))}
            </div>
          </section>
        );
      })}
      {hasMore ? (
        <div className="day-head">
          <Link className="button" href="/archive/">
            查看更多历史 → 梗库
          </Link>
        </div>
      ) : null}
    </div>
  );
}
