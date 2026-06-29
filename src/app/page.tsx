import { loadAllEnvelopes } from "@/domain/memedaily/data";
import { statusLabels } from "@/domain/memedaily/labels";
import { visibleItems } from "@/domain/memedaily/rules";
import { latestVisibleNews } from "@/domain/dailynews/data";
import { statusLabels as newsStatusLabels } from "@/domain/dailynews/labels";
import { HomeTabs } from "@/features/home/HomeTabs";

const MAX_DAYS_ON_HOME = 4;

export default function TodayPage() {
  // 热梗 feed (unchanged computation; rendered inside the 热梗 tab).
  const all = loadAllEnvelopes();
  const latest = all[0] ?? null;
  const days = all
    .map((envelope) => ({ date: envelope.date, items: visibleItems(envelope) }))
    .filter((day) => day.items.length > 0);
  const freshDate = latest && days[0]?.date === latest.date ? latest.date : null;
  const shown = days.slice(0, MAX_DAYS_ON_HOME);
  const hasMore = days.length > shown.length;

  const staleNotice =
    latest && visibleItems(latest).length === 0
      ? `最近一次运行 ${latest.date} 状态为「${statusLabels[latest.status]}」，没有合格内容——下方展示的是最近一次有内容的发布。`
      : latest && latest.status === "partial"
        ? `${latest.date} 为部分发布（partial）。鉴于合格内容较少，当日发布可能少于每日目标。`
        : null;

  const memeStatus = latest
    ? {
        date: latest.date,
        time: (latest.published_at ?? latest.generated_at).slice(11, 16),
        statusLabel: statusLabels[latest.status],
        count: visibleItems(latest).length,
      }
    : null;

  // 日报 feed (today's heat-ranked news; null until the news agent's first run). Strip the
  // internal editorial fields (wechat_bridge/filter_pass/risk) here so they never reach the
  // client bundle / serialized HTML — readers only ever get the reader-facing projection.
  const latestNews = latestVisibleNews();
  const news = latestNews
    ? {
        date: latestNews.date,
        items: latestNews.items.map((item) => ({
          id: item.id,
          headline: item.headline,
          summary: item.summary,
          category: item.category,
          heat_rank: item.heat_rank,
          sources: item.sources,
        })),
      }
    : null;

  const newsStatus = latestNews
    ? {
        date: latestNews.date,
        time: (latestNews.published_at ?? latestNews.generated_at).slice(11, 16),
        statusLabel: newsStatusLabels[latestNews.status],
        count: latestNews.items.length,
      }
    : null;

  return (
    <main className="page">
      <HomeTabs
        memeStatus={memeStatus}
        newsStatus={newsStatus}
        staleNotice={staleNotice}
        days={shown}
        freshDate={freshDate}
        hasMore={hasMore}
        news={news}
      />
    </main>
  );
}
