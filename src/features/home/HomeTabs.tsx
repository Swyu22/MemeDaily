"use client";

/**
 * input: serializable 热梗 (memes) + 日报 (news) feed data from the server page
 * output: a client tab shell — a shared status bar on top, then the tabs above the active feed
 * pos: the single shared UI touch point; TodayFeed/MemeCard/DailyReport are reused unchanged
 *
 * Layout: a HORIZONTAL two-tab row sits at the content's top-left (below the status bar, above
 * the feed) on every breakpoint — left-aligned auto-width on desktop, split 50/50 on mobile
 * (see .tabbar in globals.css). The status bar is tab-aware: it reflects the active feed's run.
 */
import { useState } from "react";
import { Activity } from "lucide-react";
import type { MemeItem } from "@/domain/memedaily/schema";
import type { PublicNewsItem } from "@/domain/dailynews/schema";
import { TodayFeed } from "@/features/memes/TodayFeed";
import { DailyReport } from "./DailyReport";

type Tab = "memes" | "news";
type RunStatus = { date: string; time: string; statusLabel: string; count: number };

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

  const status = tab === "memes" ? memeStatus : newsStatus;

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

      <div className="tabbar" role="tablist" aria-label="内容分栏">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "memes"}
          className={`button${tab === "memes" ? " primary" : ""}`}
          onClick={() => setTab("memes")}
        >
          热梗
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "news"}
          className={`button${tab === "news" ? " primary" : ""}`}
          onClick={() => setTab("news")}
        >
          日报
        </button>
      </div>

      {tab === "memes" ? (
        <>
          {staleNotice ? (
            <div className="notice" role="status">
              {staleNotice}
            </div>
          ) : null}

          {days.length > 0 ? (
            <TodayFeed days={days} freshDate={freshDate} hasMore={hasMore} />
          ) : (
            <div className="empty">
              今日没有通过证据和安全门槛的热梗。自动化会宁可跳过，也不发布弱证据内容。
            </div>
          )}
        </>
      ) : (
        <DailyReport news={news} />
      )}
    </>
  );
}
