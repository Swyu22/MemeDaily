/**
 * input: JSON files under data/daily
 * output: sorted, validated envelopes for static page generation
 * pos: filesystem-backed data loader used only at build time
 */
import fs from "node:fs";
import path from "node:path";
import { DailyEnvelopeSchema, type DailyEnvelope, type MemeItem } from "./schema";
import { visibleItems } from "./rules";

const dataDir = path.join(process.cwd(), "data", "daily");

export function dailyDataDir(): string {
  return dataDir;
}

export function dailyJsonFiles(): string[] {
  if (!fs.existsSync(dataDir)) {
    return [];
  }

  return fs
    .readdirSync(dataDir)
    .filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file))
    .sort();
}

export function loadEnvelope(fileName: string): DailyEnvelope {
  const fullPath = path.join(dataDir, fileName);
  const raw = JSON.parse(fs.readFileSync(fullPath, "utf8")) as unknown;
  return DailyEnvelopeSchema.parse(raw);
}

// Memoized: every reader (latest*, allVisibleItems, findItemById) funnels through here,
// and at static-build time the data files do not change, so one disk pass suffices.
let envelopeCache: DailyEnvelope[] | null = null;

export function loadAllEnvelopes(): DailyEnvelope[] {
  if (envelopeCache) return envelopeCache;
  envelopeCache = dailyJsonFiles()
    .map(loadEnvelope)
    .sort((a, b) => b.date.localeCompare(a.date));
  return envelopeCache;
}

export function latestEnvelope(): DailyEnvelope | null {
  return loadAllEnvelopes()[0] ?? null;
}

export function latestVisibleEnvelope(): DailyEnvelope | null {
  return loadAllEnvelopes().find((envelope) => visibleItems(envelope).length > 0) ?? null;
}

export function allVisibleItems(): Array<MemeItem & { date: string }> {
  return loadAllEnvelopes().flatMap((envelope) =>
    visibleItems(envelope).map((item) => ({ ...item, date: envelope.date })),
  );
}

export function findItemById(id: string): (MemeItem & { date: string }) | null {
  return allVisibleItems().find((item) => item.id === id) ?? null;
}
