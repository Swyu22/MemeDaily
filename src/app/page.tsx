import { Activity } from "lucide-react";
import { latestEnvelope } from "@/domain/memedaily/data";
import { sortByDecisionValue } from "@/domain/memedaily/labels";
import { visibleItems } from "@/domain/memedaily/rules";
import { MemeCard } from "@/features/memes/MemeCard";

export default function TodayPage() {
  const envelope = latestEnvelope();
  const items = envelope ? sortByDecisionValue(visibleItems(envelope)) : [];

  return (
    <main className="page">
      <section className="status-bar" aria-label="Run status">
        <strong style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Activity size={15} color="var(--green-dot)" aria-hidden="true" />
          今日运行
        </strong>
        {envelope ? (
          <>
            <span className="mono">{envelope.date}</span>
            <span>状态 {envelope.status}</span>
            <span>
              发布 <b>{items.length}</b> 条
            </span>
            <span>
              证据不足丢{" "}
              <b>{envelope.run_report.evidence_summary.dropped_insufficient_evidence}</b>
            </span>
            <span>
              低置信丢 <b>{envelope.run_report.dropped_low_confidence}</b>
            </span>
          </>
        ) : (
          <span>暂无日更数据</span>
        )}
      </section>

      <div className="toolbar">
        <span className="mini">默认按“还能上车”排序</span>
        <span className="mini">最多 10 条，不凑数</span>
        <span className="mini">公开网页证据</span>
      </div>

      {items.length > 0 ? (
        <div className="stack">
          {items.map((item, index) => (
            <MemeCard expanded={index === 0} item={item} key={item.id} />
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
