import { Activity } from "lucide-react";
import { loadAllEnvelopes } from "@/domain/memedaily/data";
import { statusLabels } from "@/domain/memedaily/labels";
import { visibleItems } from "@/domain/memedaily/rules";
import { TodayFeed } from "@/features/memes/TodayFeed";

const MAX_DAYS_ON_HOME = 4;
// 每日固定发布时间（与 daily-publish.yml 的 cron 对齐：00:00 UTC = 08:00 Asia/Shanghai）。
const PUBLISH_TIME = "08:00";

export default function TodayPage() {
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

  return (
    <main className="page">
      <section className="status-bar" aria-label="Run status">
        <strong style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Activity size={15} color="var(--green-dot)" aria-hidden="true" />
          今日运行
        </strong>
        {latest ? (
          <>
            <span className="mono">{latest.date}</span>
            <span>
              发布时间 <span className="mono">{PUBLISH_TIME}</span>
            </span>
            <span>状态 {statusLabels[latest.status]}</span>
            <span>
              发布 <b>{visibleItems(latest).length}</b> 条
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

      {shown.length > 0 ? (
        <TodayFeed days={shown} freshDate={freshDate} hasMore={hasMore} />
      ) : (
        <div className="empty">
          今日没有通过证据和安全门槛的热梗。自动化会宁可跳过，也不发布弱证据内容。
        </div>
      )}
    </main>
  );
}
