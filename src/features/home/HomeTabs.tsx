"use client";

/**
 * input: serializable 热梗 (memes) + 日报 (news) feed data from the server page
 * output: the home shell — status bar, meme toolbar, a tab-aware 大标题/副标题, folder tabs, content
 * pos: the single shared UI touch point; TodayFeed/MemeCard/DailyReport are reused
 *
 * Layout (top → bottom, IDENTICAL on both tabs — switching only changes content + heading text):
 *   1. 今日运行 status bar (tab-aware)
 *   2. 大标题 + 副标题 (今日热梗 / 今日日报 — FIXED title even when a feed is skipped/empty)
 *   3. 排序/每日目标/证据 toolbar (shown on BOTH tabs so the chrome is unified)
 *   4. folder-style tabs [热梗 | 日报] (brand-yellow underline on the active tab)
 *   5. the tab panel, flush against the tab strip (no gap)
 * The sort state (热度值/新鲜值) lives here and drives BOTH feeds: 热梗 by heat/freshness lifecycle,
 * 日报 by heat_rank / latest source time (新闻越靠近现在越靠前). Default 热度值.
 */
import { useState } from "react";
import { Activity } from "lucide-react";
import {
  feedSortLabels,
  type FeedSort,
} from "@/domain/memedaily/labels";
import type { MemeItem } from "@/domain/memedaily/schema";
import type { PublicNewsItem } from "@/domain/dailynews/schema";
import { TodayFeed } from "@/features/memes/TodayFeed";
import { DailyReport } from "./DailyReport";

type Tab = "memes" | "news";
type RunStatus = { date: string; time: string; statusLabel: string; count: number };
type FeedHead = { title: string; subtitle: string | null };

type HomeTabsProps = {
  memeStatus: RunStatus | null;
  newsStatus: RunStatus | null;
  staleNotice: string | null;
  days: { date: string; items: MemeItem[] }[];
  freshDate: string | null;
  hasMore: boolean;
  news: { date: string; items: PublicNewsItem[] } | null;
};

export function HomeTabs({
  memeStatus,
  newsStatus,
  staleNotice,
  days,
  freshDate,
  hasMore,
  news,
}: HomeTabsProps) {
  const [tab, setTab] = useState<Tab>("memes"); // 热梗 default; v1 keeps tab state client-only
  const [sort, setSort] = useState<FeedSort>("heat");

  const status = tab === "memes" ? memeStatus : newsStatus;

  // The freshest meme day (day 0) feeds the lifted 大标题/副标题; "今日热梗" only when today is fresh.
  const memeHead: FeedHead = (() => {
    const top = days[0];
    if (!top) return { title: "今日热梗", subtitle: null };
    const isToday = top.date === freshDate;
    return {
      title: "今日热梗", // fixed label — stays put whether today is published, skipped, or empty
      subtitle: `${isToday ? top.date : "历史发布"} · ${top.items.length} 条 · 按${feedSortLabels[sort]}排序`,
    };
  })();

  const newsHead: FeedHead =
    news && news.items.length > 0
      ? {
          title: "今日日报",
          subtitle: `${news.date} · ${news.items.length} 条 · 按${feedSortLabels[sort]}排序`,
        }
      : { title: "今日日报", subtitle: null };

  const head = tab === "memes" ? memeHead : newsHead;

  return (
    <>
      <section className="status-bar" aria-label="Run status">
        <strong style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Activity size={15} color="var(--green-dot)" aria-hidden="true" />
          今日运行
        </strong>
        {status ? (
          <>
            <span className="mono">{status.date}</span>
            <span>
              发布时间 <span className="mono">{status.time}</span>
            </span>
            <span>状态 {status.statusLabel}</span>
            <span>
              发布 <b>{status.count}</b> 条
            </span>
          </>
        ) : (
          <span>{tab === "memes" ? "暂无热梗数据" : "暂无日报数据"}</span>
        )}
      </section>

      <div className="feed-head">
        <h1>{head.title}</h1>
        {head.subtitle ? <p className="summary">{head.subtitle}</p> : null}
      </div>

      <div className="toolbar feed-toolbar">
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

      <div className="tabbar" role="tablist" aria-label="内容分栏">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "memes"}
          className={`tab${tab === "memes" ? " active" : ""}`}
          onClick={() => setTab("memes")}
        >
          热梗
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "news"}
          className={`tab${tab === "news" ? " active" : ""}`}
          onClick={() => setTab("news")}
        >
          日报
        </button>
      </div>

      <div className="tab-panel">
        {tab === "memes" ? (
          <>
            {staleNotice ? (
              <div className="notice" role="status">
                {staleNotice}
              </div>
            ) : null}
            {days.length > 0 ? (
              <TodayFeed days={days} hasMore={hasMore} sort={sort} />
            ) : (
              <div className="empty">
                今日没有通过证据和安全门槛的热梗。自动化会宁可跳过，也不发布弱证据内容。
              </div>
            )}
          </>
        ) : (
          <DailyReport news={news} sort={sort} />
        )}
      </div>
    </>
  );
}
