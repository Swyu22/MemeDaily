import Link from "next/link";
import { Activity } from "lucide-react";
import { loadAllEnvelopes } from "@/domain/memedaily/data";
import { sortByDecisionValue, statusLabels } from "@/domain/memedaily/labels";
import { visibleItems } from "@/domain/memedaily/rules";
import { MemeCard } from "@/features/memes/MemeCard";

const MAX_DAYS_ON_HOME = 4;

export default function TodayPage() {
  const all = loadAllEnvelopes();
  const latest = all[0] ?? null;
  const days = all
    .map((envelope) => ({
      envelope,
      items: sortByDecisionValue(visibleItems(envelope)),
    }))
    .filter((day) => day.items.length > 0);
  const isFresh = latest != null && days[0]?.envelope.date === latest.date;
  const shown = days.slice(0, MAX_DAYS_ON_HOME);
  const hasMore = days.length > shown.length;

  const staleNotice =
    latest && visibleItems(latest).length === 0
      ? `最近一次运行 ${latest.date} 状态为「${statusLabels[latest.status]}」，没有合格内容——下方展示的是最近一次有内容的发布。`
      : latest && latest.status === "partial"
        ? `${latest.date} 为部分发布（partial），可能少于每日目标。`
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

      <div className="toolbar">
        <span className="mini">默认按“还能上车”排序</span>
        <span className="mini">每日目标 10 条</span>
        <span className="mini">公开网页证据</span>
      </div>

      {days.length > 0 ? (
        <div className="day-list">
          {shown.map((day, dayIndex) => (
            <section className="day-section" key={day.envelope.date}>
              <div className="day-head">
                <div>
                  <h1>{dayIndex === 0 && isFresh ? "今日" : day.envelope.date}</h1>
                  <p className="summary">
                    {dayIndex === 0 && isFresh ? day.envelope.date : "历史发布"} ·{" "}
                    {day.items.length} 条
                  </p>
                </div>
                <span className="mini">按可借用价值排序</span>
              </div>
              <div className="stack">
                {day.items.map((item) => (
                  <MemeCard expanded item={item} key={item.id} />
                ))}
              </div>
            </section>
          ))}
          {hasMore ? (
            <div className="day-head">
              <Link className="button" href="/archive/">
                查看更多历史 → 梗库
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="empty">
          今日没有通过证据和安全门槛的热梗。自动化会宁可跳过，也不发布弱证据内容。
        </div>
      )}
    </main>
  );
}
