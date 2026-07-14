/**
 * input: a validated, reader-facing DailyNews item
 * output: a news card — emoji headline, then labeled sections 新闻简述 / 热度 / 来源媒体 / 来源链接
 * pos: feature UI for the 日报 feed; news tone, NOT a meme card
 * note: INTERNAL fields (wechat_bridge / filter_pass / risk) are never passed here (stripped at the
 *       server boundary into PublicNewsItem) — and the category chip is intentionally not rendered.
 */
import { ExternalLink } from "lucide-react";
import type { PublicNewsItem } from "@/domain/dailynews/schema";

export function NewsCard({ item }: { item: PublicNewsItem }) {
  const outlets = Array.from(new Set(item.sources.map((source) => source.outlet)));

  return (
    <article className="card news-card">
      <h2 className="news-title">{item.headline}</h2>

      <div className="news-block">
        <div className="field-label">新闻简述</div>
        <p className="field-body">{item.summary}</p>
      </div>

      <div className="news-meta">
        <div className="news-inline">
          <span className="field-label">热度</span>
          <span className="news-heat mono">第 {item.heat_rank} 位</span>
        </div>
        <div className="news-inline">
          <span className="field-label">来源媒体</span>
          <span className="news-outlets">{outlets.join(" · ")}</span>
        </div>
      </div>

      <div className="news-block">
        <div className="field-label">来源链接</div>
        <div className="sources">
          {item.sources.map((source) => (
            <a
              className="source-link"
              href={source.url}
              key={`${source.tier}-${source.url}`}
              rel="noreferrer"
              target="_blank"
            >
              <span className="source-tier">{source.outlet}</span>
              <span className="source-note">{source.title ?? source.note}</span>
              <span className="mono">{source.captured_at.slice(5, 10)}</span>
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}
