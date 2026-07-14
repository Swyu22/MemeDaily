/**
 * input: validated meme/news envelopes loaded at static-build time
 * output: home route props for the dual-feed interactive surface
 * pos: App Router composition boundary between pure domain data and HomeTabs
 */
import { loadAllEnvelopes } from "@/domain/memedaily/data";
import { statusLabels } from "@/domain/memedaily/labels";
import {
  boardStreakFor,
  nameAppearanceDates,
  publishedDates,
  visibleItems,
} from "@/domain/memedaily/rules";
import { loadAllNewsEnvelopes, visibleNewsDays } from "@/domain/dailynews/data";
import { statusLabels as newsStatusLabels } from "@/domain/dailynews/labels";
import { visibleNews } from "@/domain/dailynews/rules";
import { HomeTabs } from "@/features/home/HomeTabs";
import { homeRunState } from "./homeRunState";

const MAX_DAYS_ON_HOME = 5; // 热梗首页默认保留最近 5 天
const MAX_NEWS_DAYS_ON_HOME = 5; // 日报首页默认保留最近 5 天

export default function TodayPage() {
  // 热梗 feed (unchanged computation; rendered inside the 热梗 tab).
  const all = loadAllEnvelopes();
  const latest = all[0] ?? null;
  // 「连续上榜天数」以我们自己的库为准：用 boardStreakFor 覆盖 agent 自填的 days_on_list
  // （后者是全网累计天数，会把 6 月火过、7 月复现的梗标成「4 天」，与「连续」文案矛盾）。
  const nameDates = nameAppearanceDates(all);
  const boardDates = publishedDates(all);
  const days = all.flatMap((envelope) => {
    const items = visibleItems(envelope).map((item) => ({
        ...item,
        days_on_list: boardStreakFor(item, envelope.date, nameDates, boardDates),
      }));
    return items.length > 0 ? [{ date: envelope.date, items }] : [];
  });
  const shown = days.slice(0, MAX_DAYS_ON_HOME);
  const hasMore = days.length > shown.length;
  const memeRun = homeRunState(
    all,
    days[0]?.date ?? null,
    latest ? visibleItems(latest).length : 0,
    statusLabels,
    "热梗",
  );

  // 日报 feed (today's heat-ranked news; null until the news agent's first run). Strip the
  // internal editorial fields (wechat_bridge/filter_pass/risk) here so they never reach the
  // client bundle / serialized HTML — readers only ever get the reader-facing projection.
  const allNews = loadAllNewsEnvelopes();
  const latestNews = allNews[0] ?? null;
  const rawNewsDays = visibleNewsDays(MAX_NEWS_DAYS_ON_HOME);
  const newsDays = rawNewsDays.map((day) => ({
    date: day.date,
    items: day.items.map((item) => ({
      id: item.id,
      headline: item.headline,
      summary: item.summary,
      category: item.category,
      heat_rank: item.heat_rank,
      occurred_at: item.occurred_at,
      sources: item.sources,
    })),
  }));

  const newsRun = homeRunState(
    allNews,
    rawNewsDays[0]?.date ?? null,
    latestNews ? visibleNews(latestNews).length : 0,
    newsStatusLabels,
    "日报",
  );

  return (
    <main className="page" id="main-content">
      <HomeTabs
        memeStatus={memeRun.status}
        newsStatus={newsRun.status}
        staleNotice={memeRun.notice}
        newsStaleNotice={newsRun.notice}
        days={shown}
        freshDate={memeRun.freshDate}
        freshNewsDate={newsRun.freshDate}
        hasMore={hasMore}
        newsDays={newsDays}
      />
    </main>
  );
}
