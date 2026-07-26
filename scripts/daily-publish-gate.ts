/**
 * input: one trusted live daily envelope, one candidate envelope, and the expected date
 * output: candidate acceptance, live terminal/repair classification, and monotonic repair checks
 * pos: deterministic minimum-three trust boundary used by the Codex daily publisher workflow
 */
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { NewsEnvelopeSchema } from "../src/domain/dailynews/schema";
import { DailyEnvelopeSchema } from "../src/domain/memedaily/schema";

type JsonRecord = Record<string, unknown>;
type DailyStatus = "published" | "partial" | "skipped" | "held";
type Feed = "meme" | "news";

export type EnvelopeFacts = {
  status: DailyStatus;
  reported: number;
  rawPublished: number;
  rawItems: JsonRecord[];
  visibleItems: JsonRecord[];
};

export type LiveDecision = EnvelopeFacts & {
  action: "terminal" | "repair";
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
}

function requireItem(item: unknown, index: number): JsonRecord {
  if (!isRecord(item)) throw new Error(`items[${index}] must be an object`);
  if (typeof item.id !== "string" || item.id.length === 0) {
    throw new Error(`items[${index}].id must be a non-empty string`);
  }
  if ("published" in item && typeof item.published !== "boolean") {
    throw new Error(`items[${index}].published must be a boolean when present`);
  }
  return item;
}

function requireItems(envelope: JsonRecord): JsonRecord[] {
  if (!Array.isArray(envelope.items)) throw new Error("items must be an array");
  for (const [index, item] of envelope.items.entries()) {
    requireItem(item, index);
  }
  return envelope.items as JsonRecord[];
}

function requireStatus(value: unknown): DailyStatus {
  if (!["published", "partial", "skipped", "held"].includes(String(value))) {
    throw new Error(`unknown status: ${String(value)}`);
  }
  return value as DailyStatus;
}

function requireDate(envelope: JsonRecord, expectedDate: string): void {
  if (envelope.date !== expectedDate) {
    throw new Error(`envelope date ${String(envelope.date)} does not match ${expectedDate}`);
  }
}

function requireReported(envelope: JsonRecord): number {
  if (!isRecord(envelope.run_report)) throw new Error("run_report must be an object");
  const published = envelope.run_report.published;
  if (!Number.isInteger(published)) throw new Error("run_report.published must be an integer");
  const reported = Number(published);
  if (reported < 0) throw new Error("run_report.published must be non-negative");
  return reported;
}

function envelopeFacts(raw: unknown, expectedDate: string): EnvelopeFacts {
  if (!isRecord(raw)) throw new Error("envelope must be an object");
  requireDate(raw, expectedDate);
  const status = requireStatus(raw.status);
  const reported = requireReported(raw);
  const rawItems = requireItems(raw);
  const visibleItems = rawItems.filter((item) => item.published !== false);
  return {
    status,
    reported,
    rawPublished: visibleItems.length,
    rawItems,
    visibleItems,
  };
}

function requireMatchingCount(facts: EnvelopeFacts): void {
  if (facts.reported !== facts.rawPublished) {
    throw new Error(
      `run_report.published=${facts.reported} does not match raw published count=${facts.rawPublished}`,
    );
  }
}

export function validateCandidate(raw: unknown, expectedDate: string): EnvelopeFacts {
  const facts = envelopeFacts(raw, expectedDate);
  if (facts.status !== "published" && facts.status !== "partial") {
    throw new Error(`candidate status must be published or partial; got ${facts.status}`);
  }
  if (facts.rawItems.length !== facts.rawPublished) {
    throw new Error("candidate must not contain unpublished or hidden rows");
  }
  requireMatchingCount(facts);
  if (facts.reported < 3) {
    throw new Error(`candidate must contain at least 3 published items; got ${facts.reported}`);
  }
  return facts;
}

function requireValidSkipped(facts: EnvelopeFacts): void {
  if (facts.reported !== 0 || facts.rawPublished !== 0 || facts.rawItems.length !== 0) {
    throw new Error("skipped live envelope must report 0 and contain no raw items");
  }
}

export function classifyLive(raw: unknown, expectedDate: string): LiveDecision {
  const facts = envelopeFacts(raw, expectedDate);
  if (facts.status === "held") throw new Error("held live envelope is an incident");
  if (facts.status === "skipped") {
    requireValidSkipped(facts);
    return { ...facts, action: "repair" };
  }
  requireMatchingCount(facts);
  const action = facts.reported >= 3 ? "terminal" : "repair";
  return { ...facts, action };
}

function requirePreservedPrefix(liveItems: JsonRecord[], candidateItems: JsonRecord[]): void {
  if (candidateItems.length < liveItems.length) {
    throw new Error("repair candidate removed an existing reader-visible item");
  }
  for (const [index, liveItem] of liveItems.entries()) {
    if (JSON.stringify(candidateItems[index]) !== JSON.stringify(liveItem)) {
      throw new Error(`repair candidate changed or reordered visible item at index ${index}`);
    }
  }
}

export function preserveRepair(
  liveRaw: unknown,
  candidateRaw: unknown,
  expectedDate: string,
): void {
  const live = classifyLive(liveRaw, expectedDate);
  if (live.action !== "repair") throw new Error("live envelope is already terminal");
  const candidate = validateCandidate(candidateRaw, expectedDate);
  requirePreservedPrefix(live.visibleItems, candidate.visibleItems);
}

function usage(): string {
  return [
    "Usage:",
    "  tsx scripts/daily-publish-gate.ts validate-candidate <candidate.json> <YYYY-MM-DD> <feed>",
    "  tsx scripts/daily-publish-gate.ts classify-live <live.json> <YYYY-MM-DD> <feed>",
    "  tsx scripts/daily-publish-gate.ts preserve-repair <live.json> <candidate.json> <YYYY-MM-DD> <feed>",
  ].join("\n");
}

function requireFeed(value: string): Feed {
  if (value === "meme" || value === "news") return value;
  throw new Error(`feed must be meme or news; got ${value}`);
}

function readFeedEnvelope(file: string, feed: Feed): unknown {
  const raw = readJson(file);
  if (feed === "meme") DailyEnvelopeSchema.parse(raw);
  else NewsEnvelopeSchema.parse(raw);
  return raw;
}

function classifyForCli(file: string, expectedDate: string, feed: Feed): void {
  const result = classifyLive(readFeedEnvelope(file, feed), expectedDate);
  process.stdout.write(
    `${result.action}\t${result.status}\t${result.reported}\t${result.rawPublished}\n`,
  );
}

function requireCliArgs(args: string[], count: number): void {
  if (args.length !== count) throw new Error(usage());
}

function validateCandidateCli(args: string[]): void {
  requireCliArgs(args, 3);
  const [file = "", expectedDate = "", feed = ""] = args;
  const result = validateCandidate(readFeedEnvelope(file, requireFeed(feed)), expectedDate);
  process.stdout.write(`candidate-ok\t${result.status}\t${result.reported}\n`);
}

function classifyLiveCli(args: string[]): void {
  requireCliArgs(args, 3);
  const [file = "", expectedDate = "", feed = ""] = args;
  classifyForCli(file, expectedDate, requireFeed(feed));
}

function preserveRepairCli(args: string[]): void {
  requireCliArgs(args, 4);
  const [liveFile = "", candidateFile = "", expectedDate = "", rawFeed = ""] = args;
  const feed = requireFeed(rawFeed);
  preserveRepair(
    readFeedEnvelope(liveFile, feed),
    readFeedEnvelope(candidateFile, feed),
    expectedDate,
  );
  process.stdout.write("repair-ok\n");
}

const CLI_HANDLERS = new Map<string, (args: string[]) => void>([
  ["validate-candidate", validateCandidateCli],
  ["classify-live", classifyLiveCli],
  ["preserve-repair", preserveRepairCli],
]);

function runCli([command = "", ...args]: string[]): void {
  const handler = CLI_HANDLERS.get(command);
  if (!handler) throw new Error(usage());
  handler(args);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`daily-publish-gate: ${message}\n`);
    process.exitCode = 1;
  }
}
