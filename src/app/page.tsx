import { Activity } from "lucide-react";
import { loadAllEnvelopes } from "@/domain/memedaily/data";
import { sortByDecisionValue } from "@/domain/memedaily/labels";
import { visibleItems } from "@/domain/memedaily/rules";
import { MemeCard } from "@/features/memes/MemeCard";

export default function TodayPage() {
  const days = loadAllEnvelopes()
    .map((envelope) => ({
      envelope,
      items: sortByDecisionValue(visibleItems(envelope)),
    }))
    .filter((day) => day.items.length > 0);
  const today = days[0];

  return (
    <main className="page">
      <section className="status-bar" aria-label="Run status">
        <strong style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Activity size={15} color="var(--green-dot)" aria-hidden="true" />
          今日运行
        </strong>
        {today ? (
          <>
            <span className="mono">{today.envelope.date}</span>
            <span>
              发布 <b>{today.items.length}</b> 条
            </span>
          </>
        ) : (
          <span>暂无日更数据</span>
        )}
      </section>

      <div className="toolbar">
        <span className="mini">默认按“还能上车”排序</span>
        <span className="mini">每日目标 10 条</span>
        <span className="mini">公开网页证据</span>
      </div>

      {days.length > 0 ? (
        <div className="day-list">
          {days.map((day, dayIndex) => (
            <section className="day-section" key={day.envelope.date}>
              <div className="day-head">
                <div>
                  <h1>{dayIndex === 0 ? "今日" : day.envelope.date}</h1>
                  <p className="summary">
                    {dayIndex === 0 ? day.envelope.date : "历史发布"} · {day.items.length} 条
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
        </div>
      ) : (
        <div className="empty">
          今日没有通过证据和安全门槛的热梗。自动化会宁可跳过，也不发布弱证据内容。
        </div>
      )}
    </main>
  );
}
