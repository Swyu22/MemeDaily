/**
 * input: optional DAILYNEWS_DATE=YYYY-MM-DD and data/daily-news directory
 * output: creates a skipped 日报 envelope when the target date is missing
 * pos: GitHub Actions fallback so the 日报 feed has an explicit no-publication state
 */
import fs from "node:fs";
import path from "node:path";
import { NewsEnvelopeSchema } from "../src/domain/dailynews/schema";

function shanghaiDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  const year = get("year");
  const month = get("month");
  const day = get("day");
  if (!year || !month || !day) {
    throw new Error("Intl.DateTimeFormat did not return year/month/day parts");
  }
  return `${year}-${month}-${day}`;
}

const targetDate = process.env.DAILYNEWS_DATE ?? shanghaiDate();
const dataDir = path.join(process.cwd(), "data", "daily-news");
const filePath = path.join(dataDir, `${targetDate}.json`);

if (fs.existsSync(filePath)) {
  console.log(`[news-fallback] ${targetDate} already exists; no action`);
  process.exit(0);
}

// Real publish moment in Asia/Shanghai (fixed UTC+8, no DST).
const publishedAt = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/\.\d+Z$/, "+08:00");
const envelope = NewsEnvelopeSchema.parse({
  schema_version: "1.0",
  policy_version: "1.0",
  rubric_version: "1.0",
  date: targetDate,
  generated_at: publishedAt,
  published_at: publishedAt,
  status: "skipped",
  run_report: {
    candidates_scanned: 0,
    published: 0,
    dropped_safety: {
      政治地缘: 0,
      政府政策色彩: 0,
      明星八卦: 0,
      争议社会议题: 0,
      竞品互撕: 0,
      未经证实突发: 0,
    },
    dropped_low_confidence: 0,
    sources: [],
    evidence_summary: {
      candidates_with_urls: 0,
      official_sources: 0,
      state_media_sources: 0,
      major_media_sources: 0,
      aggregator_sources: 0,
      dropped_insufficient_evidence: 0,
    },
  },
  items: [],
});

fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(filePath, `${JSON.stringify(envelope, null, 2)}\n`);
console.log(`[news-fallback] created ${filePath}`);
