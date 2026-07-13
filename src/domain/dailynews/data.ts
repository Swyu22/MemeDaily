/**
 * input: JSON files under data/daily-news
 * output: sorted, validated news envelopes for static page generation
 * pos: filesystem-backed loader for the 日报 feed, used only at build time
 */
import fs from "node:fs";
import path from "node:path";
import { NewsEnvelopeSchema, type NewsEnvelope, type NewsItem } from "./schema";
import { visibleNews } from "./rules";

const dataDir = path.join(process.cwd(), "data", "daily-news");

export function newsJsonFiles(): string[] {
  if (!fs.existsSync(dataDir)) {
    return [];
  }

  return fs
    .readdirSync(dataDir)
    .filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file))
    .sort();
}

export function loadNewsEnvelope(fileName: string): NewsEnvelope {
  const fullPath = path.join(dataDir, fileName);
  const raw = JSON.parse(fs.readFileSync(fullPath, "utf8")) as unknown;
  return NewsEnvelopeSchema.parse(raw);
}

// Memoized: at static-build time the data files do not change, so one disk pass suffices.
let newsEnvelopeCache: NewsEnvelope[] | null = null;

export function loadAllNewsEnvelopes(): NewsEnvelope[] {
  if (newsEnvelopeCache) return newsEnvelopeCache;
  newsEnvelopeCache = newsJsonFiles()
    .map(loadNewsEnvelope)
    .sort((a, b) => b.date.localeCompare(a.date));
  return newsEnvelopeCache;
}

type VisibleNewsDay = {
  date: string;
  generated_at: string;
  published_at?: string;
  status: NewsEnvelope["status"];
  items: NewsItem[];
};

// 日报默认保留最近 N 天（与热梗一致）：每个有可见项的日期取一组，newest-first，最多 limit 天。
export function visibleNewsDays(limit: number): VisibleNewsDay[] {
  const out: VisibleNewsDay[] = [];
  for (const envelope of loadAllNewsEnvelopes()) {
    // loadAllNewsEnvelopes is date-desc, so we accumulate newest-first.
    const items = visibleNews(envelope);
    if (items.length === 0) continue;
    out.push({
      date: envelope.date,
      generated_at: envelope.generated_at,
      published_at: envelope.published_at,
      status: envelope.status,
      items,
    });
    if (out.length >= limit) break;
  }
  return out;
}
