/**
 * input: a validated DailyNews item
 * output: a lean news card — rank + headline + summary + category + source links
 * pos: feature UI for the 日报 feed; mirrors MemeCard but minimal
 * note: INTERNAL fields (wechat_bridge / filter_pass / risk) are deliberately NOT rendered,
 *       exactly as MemeCard never renders brand_usage / risk.
 */
import { ExternalLink } from "lucide-react";
import { categoryLabels, newsTierLabels } from "@/domain/dailynews/labels";
import type { PublicNewsItem } from "@/domain/dailynews/schema";

export function NewsCard({ item }: { item: PublicNewsItem }) {
  return (
    <article className="card">
      <div className="card-head">
        <div className="head-main">
          <h2>{item.headline}</h2>
          <p className="summary">{item.summary}</p>
        </div>
        <div className="tag-row head-aside">
          <span className="value">
            热点 <b className="mono">#{item.heat_rank}</b>
          </span>
        </div>
      </div>

      <div className="tag-row">
        <span className="mini">{categoryLabels[item.category]}</span>
      </div>

      <div className="sources">
        {item.sources.map((source) => (
          <a
            className="source-link"
            href={source.url}
            key={`${source.tier}-${source.url}`}
            rel="noreferrer"
            target="_blank"
          >
            <span className="source-tier">{newsTierLabels[source.tier]}</span>
            <span className="source-note">{source.title ?? source.note}</span>
            <span className="mono">{source.captured_at.slice(5, 10)}</span>
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        ))}
      </div>
    </article>
  );
}
