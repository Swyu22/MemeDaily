/**
 * input: one trusted live daily envelope, one candidate envelope, and the expected date
 * output: candidate acceptance, editorial-complete live classification, and bounded repair checks
 * pos: deterministic trust boundary used by the Codex daily publisher workflow
 */
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import {
  NEWS_EDITORIAL_POLICY_VERSION,
  NewsEnvelopeSchema,
} from "../src/domain/dailynews/schema";
import {
  MEME_EDITORIAL_POLICY_VERSION,
  DailyEnvelopeSchema,
} from "../src/domain/memedaily/schema";

type JsonRecord = Record<string, unknown>;
type DailyStatus = "published" | "partial" | "skipped" | "held";
type Feed = "meme" | "news";
type RepairKind = "none" | "minimum" | "policy_migration";

const EDITORIAL_COMPLETENESS_DATE = "2026-08-01";
const CURRENT_POLICIES: Record<Feed, string> = {
  meme: MEME_EDITORIAL_POLICY_VERSION,
  news: NEWS_EDITORIAL_POLICY_VERSION,
};

export type EnvelopeFacts = {
  status: DailyStatus;
  reported: number;
  rawPublished: number;
  rawItems: JsonRecord[];
  visibleItems: JsonRecord[];
};

export type LiveDecision = EnvelopeFacts & {
  action: "terminal" | "repair";
  repairKind: RepairKind;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
}

function requireRecord(value: unknown, message: string): JsonRecord {
  if (!isRecord(value)) throw new Error(message);
  return value;
}

function requireItemId(item: JsonRecord, index: number): void {
  if (typeof item.id !== "string") {
    throw new Error(`items[${index}].id must be a non-empty string`);
  }
  if (item.id.length === 0) {
    throw new Error(`items[${index}].id must be a non-empty string`);
  }
}

function requirePublishedFlag(item: JsonRecord, index: number): void {
  if (!("published" in item)) return;
  if (typeof item.published !== "boolean") {
    throw new Error(`items[${index}].published must be a boolean when present`);
  }
}

function requireItem(item: unknown, index: number): JsonRecord {
  const record = requireRecord(item, `items[${index}] must be an object`);
  requireItemId(record, index);
  requirePublishedFlag(record, index);
  return record;
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

function hasEditorialCompleteSelection(envelope: JsonRecord): boolean {
  const report = envelope.run_report;
  if (!isRecord(report)) return false;
  const selection = report.selection;
  if (!isRecord(selection)) return false;
  return selection.editorial_complete === true;
}

function requireCurrentPolicy(envelope: JsonRecord, feed: Feed): void {
  if (envelope.policy_version !== CURRENT_POLICIES[feed]) {
    throw new Error(
      `candidate policy_version must be ${CURRENT_POLICIES[feed]}; got ${String(envelope.policy_version)}`,
    );
  }
}

function requireEditorialComplete(raw: unknown, feed: Feed): void {
  const envelope = requireRecord(raw, "envelope must be an object");
  requireCurrentPolicy(envelope, feed);
  if (!hasEditorialCompleteSelection(envelope)) {
    throw new Error("candidate must declare run_report.selection.editorial_complete=true");
  }
}

function requireHistoricalEvaluationClock(
  raw: unknown,
  expectedDate: string,
  publisherDate: string,
): void {
  if (expectedDate >= publisherDate) return;
  const envelope = requireRecord(raw, "envelope must be an object");
  const report = requireRecord(envelope.run_report, "run_report must be an object");
  const selection = requireRecord(report.selection, "run_report.selection must be an object");
  if (typeof selection.evaluated_at === "string") return;
  throw new Error("historical candidate must declare run_report.selection.evaluated_at");
}

function requireCandidateStatus(status: DailyStatus): void {
  if (status === "published") return;
  if (status === "partial") return;
  throw new Error(`candidate status must be published or partial; got ${status}`);
}

function requireNoHiddenRows(facts: EnvelopeFacts): void {
  if (facts.rawItems.length === facts.rawPublished) return;
  throw new Error("candidate must not contain unpublished or hidden rows");
}

function requireMinimumItems(facts: EnvelopeFacts): void {
  if (facts.reported >= 3) return;
  throw new Error(`candidate must contain at least 3 published items; got ${facts.reported}`);
}

export function validateCandidate(
  raw: unknown,
  expectedDate: string,
  feed: Feed,
  publisherDate = expectedDate,
): EnvelopeFacts {
  const facts = envelopeFacts(raw, expectedDate);
  requireCandidateStatus(facts.status);
  requireNoHiddenRows(facts);
  requireMatchingCount(facts);
  requireMinimumItems(facts);
  requireEditorialComplete(raw, feed);
  requireHistoricalEvaluationClock(raw, expectedDate, publisherDate);
  return facts;
}

function requireValidSkipped(facts: EnvelopeFacts): void {
  if (facts.reported !== 0 || facts.rawPublished !== 0 || facts.rawItems.length !== 0) {
    throw new Error("skipped live envelope must report 0 and contain no raw items");
  }
}

function isCurrentEditorialComplete(raw: unknown, feed: Feed): boolean {
  if (!isRecord(raw)) return false;
  if (raw.policy_version !== CURRENT_POLICIES[feed]) return false;
  return hasEditorialCompleteSelection(raw);
}

function repairDecision(facts: EnvelopeFacts, repairKind: RepairKind): LiveDecision {
  return { ...facts, action: "repair", repairKind };
}

function terminalDecision(facts: EnvelopeFacts): LiveDecision {
  return { ...facts, action: "terminal", repairKind: "none" };
}

function requireLiveNotHeld(facts: EnvelopeFacts): void {
  if (facts.status !== "held") return;
  throw new Error("held live envelope is an incident");
}

function requireSkippedShape(facts: EnvelopeFacts): void {
  if (facts.status !== "skipped") return;
  requireValidSkipped(facts);
}

function minimumDecision(facts: EnvelopeFacts): LiveDecision | undefined {
  if (facts.reported >= 3) return undefined;
  return repairDecision(facts, "minimum");
}

function policyMigrationDecision(
  raw: unknown,
  expectedDate: string,
  feed: Feed,
  facts: EnvelopeFacts,
): LiveDecision | undefined {
  if (expectedDate < EDITORIAL_COMPLETENESS_DATE) return undefined;
  if (!isRecord(raw)) return undefined;
  if (raw.policy_version === CURRENT_POLICIES[feed]) return undefined;
  return repairDecision(facts, "policy_migration");
}

function requirePolicyMigrationEligible(raw: unknown, feed: Feed): void {
  if (!isRecord(raw)) return;
  if (raw.policy_version !== CURRENT_POLICIES[feed]) return;
  throw new Error("current-policy live envelope is not editorially complete");
}

function completeDayDecision(
  raw: unknown,
  expectedDate: string,
  feed: Feed,
  facts: EnvelopeFacts,
): LiveDecision {
  if (expectedDate < EDITORIAL_COMPLETENESS_DATE) return terminalDecision(facts);
  if (isCurrentEditorialComplete(raw, feed)) return terminalDecision(facts);
  requirePolicyMigrationEligible(raw, feed);
  return repairDecision(facts, "policy_migration");
}

export function classifyLive(raw: unknown, expectedDate: string, feed: Feed): LiveDecision {
  const facts = envelopeFacts(raw, expectedDate);
  requireLiveNotHeld(facts);
  requireSkippedShape(facts);
  requireMatchingCount(facts);
  const migration = policyMigrationDecision(raw, expectedDate, feed, facts);
  if (migration) return migration;
  const minimum = minimumDecision(facts);
  if (minimum) return minimum;
  return completeDayDecision(raw, expectedDate, feed, facts);
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
  feed: Feed,
): void {
  const live = classifyLive(liveRaw, expectedDate, feed);
  if (live.action !== "repair") throw new Error("live envelope is already terminal");
  const candidate = validateCandidate(candidateRaw, expectedDate, feed);
  if (live.repairKind === "minimum") {
    requirePreservedPrefix(live.visibleItems, candidate.visibleItems);
  }
}

function usage(): string {
  return [
    "Usage:",
    "  tsx scripts/daily-publish-gate.ts validate-candidate <candidate.json> <YYYY-MM-DD> <feed> [publisher-date]",
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
  const result = classifyLive(readFeedEnvelope(file, feed), expectedDate, feed);
  process.stdout.write(
    `${result.action}\t${result.status}\t${result.reported}\t${result.rawPublished}\t${result.repairKind}\n`,
  );
}

function requireCliArgs(args: string[], count: number): void {
  if (args.length !== count) throw new Error(usage());
}

function cliArg(args: string[], index: number): string {
  return args[index] ?? "";
}

function validateCandidateCli(args: string[]): void {
  if (args.length !== 3 && args.length !== 4) throw new Error(usage());
  const file = cliArg(args, 0);
  const expectedDate = cliArg(args, 1);
  const parsedFeed = requireFeed(cliArg(args, 2));
  const publisherDate = cliArg(args, 3) || expectedDate;
  const result = validateCandidate(
    readFeedEnvelope(file, parsedFeed),
    expectedDate,
    parsedFeed,
    publisherDate,
  );
  process.stdout.write(`candidate-ok\t${result.status}\t${result.reported}\n`);
}

function classifyLiveCli(args: string[]): void {
  requireCliArgs(args, 3);
  const file = cliArg(args, 0);
  const expectedDate = cliArg(args, 1);
  classifyForCli(file, expectedDate, requireFeed(cliArg(args, 2)));
}

function preserveRepairCli(args: string[]): void {
  requireCliArgs(args, 4);
  const liveFile = cliArg(args, 0);
  const candidateFile = cliArg(args, 1);
  const expectedDate = cliArg(args, 2);
  const feed = requireFeed(cliArg(args, 3));
  preserveRepair(
    readFeedEnvelope(liveFile, feed),
    readFeedEnvelope(candidateFile, feed),
    expectedDate,
    feed,
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
