"use client";

/**
 * input: serializable 热梗 (memes) + 日报 (news) feed data from the server page
 * output: a client tab shell switching between the two feeds (热梗 default)
 * pos: the single shared UI touch point; TodayFeed/MemeCard are reused unchanged
 */
import { useState } from "react";
import { Activity } from "lucide-react";
import type { MemeItem } from "@/domain/memedaily/schema";
import type { PublicNewsItem } from "@/domain/dailynews/schema";
import { TodayFeed } from "@/features/memes/TodayFeed";
import { DailyReport } from "./DailyReport";

type Tab = "memes" | "news";
type MemeStatus = { date: string; time: string; statusLabel: string; count: number };

type HomeTabsProps = {
  memeStatus: MemeStatus | null;
  staleNotice: string | null;
  days: { date: string; items: MemeItem[] }[];
  freshDate: string | null;
  hasMore: boolean;
  news: { date: string; items: PublicNewsItem[] } | null;
};

export function HomeTabs({ memeStatus, staleNotice, days, freshDate, hasMore, news }: HomeTabsProps) {
  const [tab, setTab] = useState<Tab>("memes"); // 热梗 default; v1 keeps tab state client-only

  return (
    <>
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
          <section className="status-bar" aria-label="Run status">
            <strong style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Activity size={15} color="var(--green-dot)" aria-hidden="true" />
              今日运行
            </strong>
            {memeStatus ? (
              <>
                <span className="mono">{memeStatus.date}</span>
                <span>
                  发布时间 <span className="mono">{memeStatus.time}</span>
                </span>
                <span>状态 {memeStatus.statusLabel}</span>
                <span>
                  发布 <b>{memeStatus.count}</b> 条
                </span>
              </>
            ) : (
              <span>暂无日更数据</span>
            )}
          </section>

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
