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
 *   4. folder-style tabs [热梗 | 日报] (brand-yellow underline on the active tab) — STICKY: they
 *      pin just under the site header while scrolling and release when scrolled back up, so the
 *      reader can quick-switch feeds mid-scroll. Switching while scrolled past snaps the strip back
 *      to its sticky line so the newly-selected feed starts right below the tabs.
 *   5. the tab panel, flush against the tab strip (no gap)
 * The sort state (热度值/新鲜值) lives here and drives BOTH feeds: 热梗 by heat/freshness lifecycle,
 * 日报 by heat_rank / latest source time (新闻越靠近现在越靠前). Each feed keeps its own sort
 * independently; both default to 新鲜值.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
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

type NewsDay = { date: string; items: PublicNewsItem[] };
const TABS: Tab[] = ["memes", "news"];

function tabForKey(current: Tab, key: string): Tab | null {
  if (key === "Home") return TABS[0] ?? null;
  if (key === "End") return TABS.at(-1) ?? null;
  if (key !== "ArrowLeft" && key !== "ArrowRight") return null;
  const offset = key === "ArrowRight" ? 1 : -1;
  const index = TABS.indexOf(current);
  return TABS[(index + offset + TABS.length) % TABS.length] ?? null;
}

type HomeTabsProps = {
  memeStatus: RunStatus | null;
  newsStatus: RunStatus | null;
  staleNotice: string | null;
  newsStaleNotice: string | null;
  days: { date: string; items: MemeItem[] }[];
  freshDate: string | null;
  freshNewsDate: string | null;
  hasMore: boolean;
  newsDays: NewsDay[];
};

export function HomeTabs({
  memeStatus,
  newsStatus,
  staleNotice,
  newsStaleNotice,
  days,
  freshDate,
  freshNewsDate,
  hasMore,
  newsDays,
}: HomeTabsProps) {
  const [tab, setTab] = useState<Tab>("memes"); // 热梗 default; v1 keeps tab state client-only
  // Each feed carries its OWN sort, both defaulting to 新鲜值 (热梗 = freshest lifecycle first, 日报 =
  // newest event time first). The single toolbar control drives whichever feed is active and
  // remembers each tab's choice independently.
  const [memeSort, setMemeSort] = useState<FeedSort>("fresh");
  const [newsSort, setNewsSort] = useState<FeedSort>("fresh");
  const sort = tab === "memes" ? memeSort : newsSort;
  const setSort = tab === "memes" ? setMemeSort : setNewsSort;
  // A zero-height, NON-sticky anchor rendered just above the tab strip. Reading its position gives
  // the strip's true natural document offset — the tabbar itself can't be used because a stuck
  // sticky element reports its pinned position, not its flow position.
  const tabsTopRef = useRef<HTMLDivElement>(null);

  // Keep --header-h in sync with the real (sticky) site header height so the tab strip pins exactly
  // below it on every breakpoint (the mobile 2-row header is taller than desktop's). CSS has a 58px
  // fallback for first paint / no-JS.
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      const header = document.querySelector(".topbar");
      if (header) {
        root.style.setProperty("--header-h", `${Math.round(header.getBoundingClientRect().height)}px`);
      }
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  // Switch tabs; if the strip is already pinned (reader scrolled into the content), snap back to the
  // sticky line so the newly-selected feed starts right below the tabs instead of mid-scroll.
  const switchTab = (next: Tab) => {
    setTab(next);
    const anchor = tabsTopRef.current;
    if (!anchor) return;
    const headerH = document.querySelector(".topbar")?.getBoundingClientRect().height ?? 0;
    const naturalTop = anchor.getBoundingClientRect().top + window.scrollY;
    const target = naturalTop - headerH;
    if (window.scrollY > target) window.scrollTo({ top: Math.max(0, target) });
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, current: Tab) => {
    const next = tabForKey(current, event.key);
    if (!next) return;
    event.preventDefault();
    switchTab(next);
    requestAnimationFrame(() => document.getElementById(`tab-${next}`)?.focus());
  };

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

  const newsHead: FeedHead = (() => {
    const top = newsDays[0];
    if (!top) return { title: "今日日报", subtitle: null };
    const isLatest = top.date === freshNewsDate;
    return {
      title: "今日日报",
      subtitle: `${isLatest ? top.date : "历史发布"} · ${top.items.length} 条 · 按${feedSortLabels[sort]}排序`,
    };
  })();

  const head = tab === "memes" ? memeHead : newsHead;

  return (
    <>
      <section className="status-bar" aria-label="今日运行状态">
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
          name="feed-sort"
          onChange={(event) => setSort(event.target.value as FeedSort)}
          aria-label="排序方式"
        >
          <option value="heat">{feedSortLabels.heat}</option>
          <option value="fresh">{feedSortLabels.fresh}</option>
        </select>
        <span className="mini">每日目标 10 条</span>
        <span className="mini">公开网页证据</span>
      </div>

      <div ref={tabsTopRef} aria-hidden="true" />
      <div className="tabbar" role="tablist" aria-label="内容分栏">
        <button
          type="button"
          id="tab-memes"
          role="tab"
          aria-selected={tab === "memes"}
          aria-controls="feed-panel"
          tabIndex={tab === "memes" ? 0 : -1}
          className={`tab${tab === "memes" ? " active" : ""}`}
          onClick={() => switchTab("memes")}
          onKeyDown={(event) => onTabKeyDown(event, "memes")}
        >
          热梗
        </button>
        <button
          type="button"
          id="tab-news"
          role="tab"
          aria-selected={tab === "news"}
          aria-controls="feed-panel"
          tabIndex={tab === "news" ? 0 : -1}
          className={`tab${tab === "news" ? " active" : ""}`}
          onClick={() => switchTab("news")}
          onKeyDown={(event) => onTabKeyDown(event, "news")}
        >
          日报
        </button>
      </div>

      <div
        aria-labelledby={`tab-${tab}`}
        className="tab-panel"
        id="feed-panel"
        role="tabpanel"
        tabIndex={0}
      >
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
          <>
            {newsStaleNotice ? (
              <div className="notice" role="status">
                {newsStaleNotice}
              </div>
            ) : null}
            <DailyReport days={newsDays} sort={sort} />
          </>
        )}
      </div>
    </>
  );
}
