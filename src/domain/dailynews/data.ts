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

// v1 shows only TODAY's 日报: the most recent envelope that has visible items.
// Returns null when there is no news data yet (the 日报 tab renders an empty state).
export function latestVisibleNews(): {
  date: string;
  generated_at: string;
  published_at?: string;
  items: NewsItem[];
} | null {
  for (const envelope of loadAllNewsEnvelopes()) {
    const items = visibleNews(envelope);
    if (items.length > 0) {
      return {
        date: envelope.date,
        generated_at: envelope.generated_at,
        published_at: envelope.published_at,
        items,
      };
    }
  }
  return null;
}
