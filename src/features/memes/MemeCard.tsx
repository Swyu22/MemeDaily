/**
 * input: a validated MemeDaily item
 * output: compact card with inline decision details and wrapped evidence links
 * pos: feature UI component shared by Today and detail surfaces
 */
import { ExternalLink } from "lucide-react";
import { lifecycleLabels, platformLabels, tierLabels } from "@/domain/memedaily/labels";
import type { MemeItem } from "@/domain/memedaily/schema";

type MemeCardProps = {
  item: MemeItem;
  expanded?: boolean;
};

export function MemeCard({ item, expanded = false }: MemeCardProps) {
  return (
    <article className="card" data-faded={item.lifecycle === "declining"}>
      <div className="card-head">
        <div>
          <h2>{item.title}</h2>
          <p className="summary">{item.summary}</p>
        </div>
        <div className="tag-row" style={{ marginTop: 0 }}>
          {item.score !== undefined ? (
            <span className="value">
              价值 <b className="mono">{item.score}</b>
            </span>
          ) : null}
          <span className="badge" data-life={item.lifecycle}>
            {lifecycleLabels[item.lifecycle]}
          </span>
        </div>
      </div>

      <div className="tag-row">
        <span className="mini">{item.platform.map((value) => platformLabels[value]).join(" · ")}</span>
        <span className="mini">{item.type}</span>
        {item.days_on_list ? <span className="mini">连续 {item.days_on_list} 天</span> : null}
      </div>

      {expanded ? <MemeDetailFields item={item} /> : <MemeSourceList item={item} compact />}

      <div className="tag-row">
        <a className="button" href={`/meme/${item.id}/index.html`}>
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
