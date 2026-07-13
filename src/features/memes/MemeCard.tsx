/**
 * input: a validated MemeDaily item
 * output: compact card with inline decision details and wrapped evidence links
 * pos: feature UI component shared by Today and detail surfaces
 * note: currently always rendered with `expanded` (see TodayFeed); the compact
 *       (non-expanded) branch + MemeSourceList `compact` mode are reserved for reuse.
 */
import { ExternalLink } from "lucide-react";
import { lifecycleLabels, platformLabels, tierLabels } from "@/domain/memedaily/labels";
import type { MemeItem } from "@/domain/memedaily/schema";

// basePath prefix for raw <a> internal links (Next only rewrites next/link). See next.config.mjs.
const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type MemeCardProps = {
  item: MemeItem;
  expanded?: boolean;
};

export function MemeCard({ item, expanded = false }: MemeCardProps) {
  return (
    <article className="card" data-faded={item.lifecycle === "declining"}>
      <div className="card-head">
        <div className="head-main">
          <h2>{item.title}</h2>
          <p className="summary">{item.summary}</p>
        </div>
        <div className="tag-row head-aside">
          {item.score !== undefined ? (
            <span className="value">
              价值 <b className="mono">{item.score}</b>
            </span>
          ) : (
            <span className="mini">未评分</span>
          )}
          <span className="badge" data-life={item.lifecycle}>
            {lifecycleLabels[item.lifecycle]}
          </span>
        </div>
      </div>

      <div className="tag-row">
        <span className="mini">{item.platform.map((value) => platformLabels[value]).join(" · ")}</span>
        <span className="mini">{item.type}</span>
        {/* Streak chip: day 1 reads "第 1 天上榜" plain (no emphasis); >=2 days reads
            "连续 N 天上榜" with the count highlighted (red + enlarged) to mark a meme
            that genuinely persisted on the list. */}
        {(item.days_on_list ?? 0) >= 2 ? (
          <span className="mini">
            连续 <span className="streak-n">{item.days_on_list}</span> 天上榜
          </span>
        ) : (item.days_on_list ?? 0) === 1 ? (
          <span className="mini">第 1 天上榜</span>
        ) : null}
      </div>

      {expanded ? <MemeDetailFields item={item} /> : <MemeSourceList item={item} compact />}

      <div className="tag-row">
        <a className="button" href={`${BP}/meme/${item.id}/index.html`}>
          查看档案
        </a>
      </div>
    </article>
  );
}

export function MemeDetailFields({ item }: { item: MemeItem }) {
  return (
    <div className="detail-panel">
      <Field label="来源" body={item.origin} />
      <Field label="典型用法 / 传播场景" body={item.usage} />
      <Field label="为什么被传播放大" body={item.why_spread} />
      <Field label="有趣点" body={item.fun_point} />

      <section>
        <div className="field-label">信源</div>
        <MemeSourceList item={item} />
      </section>
    </div>
  );
}

export function MemeSourceList({ item, compact = false }: { item: MemeItem; compact?: boolean }) {
  return (
    <div className={compact ? "sources sources-compact" : "sources"}>
      {item.sources.map((source) => (
        <a
          className="source-link"
          href={source.url}
          key={`${source.tier}-${source.url}`}
          rel="noreferrer"
          target="_blank"
        >
          <span className="source-tier">{tierLabels[source.tier]}</span>
          <span className="source-note">{source.title ?? source.note}</span>
          <span className="mono">{source.captured_at.slice(5, 10)}</span>
          <ExternalLink size={13} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

function Field({ label, body }: { label: string; body: string }) {
  return (
    <section>
      <div className="field-label">{label}</div>
      <div className="field-body">{body}</div>
    </section>
  );
}
