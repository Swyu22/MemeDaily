/**
 * input: one agent-produced MemeDaily or DailyNews JSON file and the trusted runner clock
 * output: schema-valid JSON with trusted acceptance time or a future-source rejection
 * pos: deterministic trust-boundary normalizer used before validation and git publication
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DailyEnvelopeSchema } from "../src/domain/memedaily/schema";
import { NewsEnvelopeSchema } from "../src/domain/dailynews/schema";

type TimestampEnvelope = {
  generated_at: string;
  published_at?: string;
  items: { sources: { captured_at: string }[] }[];
};

export function shanghaiTimestamp(nowMs = Date.now()): string {
  return new Date(nowMs + 8 * 60 * 60 * 1_000)
    .toISOString()
    .replace(/\.\d+Z$/, "+08:00");
}

function assertSourceTimes(
  items: TimestampEnvelope["items"],
  publishedAt: string,
  publishedMs: number,
): void {
  for (const item of items) {
    for (const source of item.sources) {
      if (Date.parse(source.captured_at) > publishedMs) {
        throw new Error(`Source captured_at ${source.captured_at} is after trusted time ${publishedAt}`);
      }
    }
  }
}

export function normalizePublishTimes<T extends TimestampEnvelope>(
  envelope: T,
  publishedAt: string,
): T {
  const publishedMs = Date.parse(publishedAt);
  if (!Number.isFinite(publishedMs)) throw new Error(`Invalid publish timestamp: ${publishedAt}`);

  const normalized = structuredClone(envelope);
  assertSourceTimes(normalized.items, publishedAt, publishedMs);
  normalized.generated_at = publishedAt;
  normalized.published_at = publishedAt;
  return normalized;
}

function stampFile(filePath: string): void {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
  const isNews = filePath.split(path.sep).includes("daily-news");
  const schema = isNews ? NewsEnvelopeSchema : DailyEnvelopeSchema;
  const parsed = schema.parse(raw);
  const normalized = normalizePublishTimes(parsed, shanghaiTimestamp());
  schema.parse(normalized);
  fs.writeFileSync(filePath, `${JSON.stringify(normalized, null, 2)}\n`);
}

function main(): void {
  const filePath = process.argv[2];
  if (!filePath) throw new Error("Usage: tsx scripts/stamp-publish-time.ts <daily-json-path>");
  stampFile(filePath);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) main();
