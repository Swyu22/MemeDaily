"use client";

/**
 * input: prevalidated visible meme days (today + recent)
 * output: the home feed with a heat/freshness sort toggle, grouped by date
 * pos: client interaction layer; server page passes serializable day data
 */
import { useState } from "react";
import Link from "next/link";
import {
  feedSortLabels,
  sortByFreshness,
  sortByHeat,
  type FeedSort,
} from "@/domain/memedaily/labels";
import type { MemeItem } from "@/domain/memedaily/schema";
import { MemeCard } from "./MemeCard";

type FeedDay = { date: string; items: MemeItem[] };

type TodayFeedProps = {
  days: FeedDay[];
  freshDate: string | null;
  hasMore: boolean;
};

export function TodayFeed({ days, freshDate, hasMore }: TodayFeedProps) {
  const [sort, setSort] = useState<FeedSort>("heat");
  const sortFn = sort === "heat" ? sortByHeat : sortByFreshness;

  return (
    <>
      <div className="toolbar">
        <span className="mini">排序</span>
        <select
          className="select"
          value={sort}
          onChange={(event) => setSort(event.target.value as FeedSort)}
          aria-label="排序方式"
        >
          <option value="heat">{feedSortLabels.heat}</option>
          <option value="fresh">{feedSortLabels.fresh}</option>
        </select>
        <span className="mini">每日目标 10 条</span>
        <span className="mini">公开网页证据</span>
      </div>

      <div className="day-list">
        {days.map((day, dayIndex) => {
          const isToday = dayIndex === 0 && day.date === freshDate;
          return (
            <section className="day-section" key={day.date}>
              <div className="day-head">
                <div>
                  <h1>{isToday ? "今日" : day.date}</h1>
                  <p className="summary">
                    {isToday ? day.date : "历史发布"} · {day.items.length} 条
                  </p>
                </div>
                <span className="mini">按{feedSortLabels[sort]}排序</span>
              </div>
              <div className="stack">
                {sortFn(day.items).map((item) => (
                  <MemeCard expanded item={item} key={item.id} />
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
    </>
  );
}
