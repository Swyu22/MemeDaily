/**
 * input: structural daily-envelope fixtures at the trusted candidate/live publication boundary
 * output: coverage for current-policy completion, legacy migration, incidents, and bounded repair
 * pos: deterministic unit contract for scripts/daily-publish-gate.ts
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";
import { NEWS_EDITORIAL_POLICY_VERSION } from "../src/domain/dailynews/schema";
import { MEME_EDITORIAL_POLICY_VERSION } from "../src/domain/memedaily/schema";
import {
  classifyLive,
  preserveRepair,
  validateCandidate,
} from "./daily-publish-gate";

const DATE = "2026-07-26";
const CURRENT_DATE = "2026-08-01";
const SCRIPT = path.join(process.cwd(), "scripts", "daily-publish-gate.ts");
const WORKFLOW = path.join(
  process.cwd(),
  ".github",
  "workflows",
  "codex-daily-pr-publish.yml",
);

type FixtureOptions = {
  date?: string;
  status?: string;
  reported?: unknown;
  items?: unknown;
  policy?: string;
  editorialComplete?: boolean;
};

type ExtractedRunBlock = {
  text: string;
  nextIndex: number;
};

function nullishOr<T>(value: T | null | undefined, fallback: T): T {
  if (value === undefined) return fallback;
  if (value === null) return fallback;
  return value;
}

function item(id: string, published = true): Record<string, unknown> {
  return { id, title: `item-${id}`, published };
}

function envelope(options: FixtureOptions = {}): Record<string, unknown> {
  return {
    policy_version: nullishOr(options.policy, MEME_EDITORIAL_POLICY_VERSION),
    date: nullishOr(options.date, DATE),
    status: nullishOr(options.status, "published"),
    run_report: {
      published: nullishOr(options.reported, 3),
      selection: { editorial_complete: nullishOr(options.editorialComplete, true) },
    },
    items: nullishOr(options.items, [item("a"), item("b"), item("c")]),
  };
}

function lineAt(lines: string[], index: number): string {
  return lines[index] ?? "";
}

function runBlockIndent(line: string): number | undefined {
  const marker = line.match(/^(\s*)run:\s*\|\s*$/);
  if (!marker) return undefined;
  return marker[1]!.length;
}

function leadingIndent(line: string): number {
  return line.match(/^\s*/)![0]!.length;
}

function endsRunBlock(line: string, baseIndent: number): boolean {
  if (!line.trim()) return false;
  return leadingIndent(line) <= baseIndent;
}

function extractRunBlock(
  lines: string[],
  startIndex: number,
  baseIndent: number,
): ExtractedRunBlock {
  const block: string[] = [];
  let index = startIndex;
  while (index < lines.length) {
    const line = lineAt(lines, index);
    if (endsRunBlock(line, baseIndent)) break;
    block.push(line.slice(Math.min(line.length, baseIndent + 2)));
    index += 1;
  }
  return { text: block.join("\n"), nextIndex: index };
}

function workflowRunBlocks(text: string): string[] {
  const lines = text.split("\n");
  const blocks: string[] = [];
  let index = 0;
  while (index < lines.length) {
    const baseIndent = runBlockIndent(lineAt(lines, index));
    if (baseIndent === undefined) {
      index += 1;
      continue;
    }
    const extracted = extractRunBlock(lines, index + 1, baseIndent);
    blocks.push(extracted.text);
    index = extracted.nextIndex;
  }
  return blocks;
}

it("accepts a candidate only when its date, status, count, and minimum agree", () => {
  const result = validateCandidate(envelope(), DATE, "meme");
  expect(result).toMatchObject({ status: "published", reported: 3, rawPublished: 3 });
});

it.each([
  ["date mismatch", { date: "2026-07-25" }],
  ["invalid status", { status: "skipped", reported: 0, items: [] }],
  ["non-integer report", { reported: 3.5 }],
  ["below minimum", { reported: 2, items: [item("a"), item("b")] }],
  ["count mismatch", { reported: 3, items: [item("a"), item("b")] }],
  [
    "hidden row",
    { reported: 3, items: [item("a"), item("b"), item("c"), item("draft", false)] },
  ],
])("rejects a candidate with %s", (_label, options) => {
  expect(() => validateCandidate(envelope(options), DATE, "meme")).toThrow();
});

it.each([
  ["legacy policy", { policy: "v3-dynamic-selection" }],
  ["false completion", { editorialComplete: false }],
])("rejects a candidate with %s", (_label, options) => {
  expect(() => validateCandidate(envelope(options), DATE, "meme")).toThrow();
});

it("classifies a well-formed empty skipped day as repairable", () => {
  const result = classifyLive(
    envelope({ status: "skipped", reported: 0, items: [] }),
    DATE,
    "meme",
  );
  expect(result.action).toBe("repair");
  expect(result.repairKind).toBe("minimum");
});

it.each([
  [0, "repair"],
  [1, "repair"],
  [2, "repair"],
  [3, "terminal"],
  [7, "terminal"],
])("classifies a count-consistent published live day with %i items as %s", (count, action) => {
  const items = Array.from({ length: count }, (_, index) => item(String(index)));
  expect(classifyLive(envelope({ reported: count, items }), DATE, "meme").action).toBe(action);
});

it("treats today's legacy policy as a one-time replaceable migration", () => {
  const live = envelope({ date: CURRENT_DATE, policy: "v3-dynamic-selection" });
  expect(classifyLive(live, CURRENT_DATE, "meme")).toMatchObject({
    action: "repair",
    repairKind: "policy_migration",
  });
});

it("treats today's current editorially complete policy as terminal", () => {
  expect(classifyLive(envelope({ date: CURRENT_DATE }), CURRENT_DATE, "meme")).toMatchObject({
    action: "terminal",
    repairKind: "none",
  });
});

it("fails closed when today's current policy is not editorially complete", () => {
  const live = envelope({ date: CURRENT_DATE, editorialComplete: false });
  expect(() => classifyLive(live, CURRENT_DATE, "meme")).toThrow(
    "current-policy live envelope is not editorially complete",
  );
});

it.each([
  ["held status", { status: "held", reported: 0, items: [] }],
  ["unknown status", { status: "mystery" }],
  ["malformed report", { reported: "3" }],
  ["date mismatch", { date: "2026-07-25" }],
  ["published count mismatch", { reported: 2 }],
  ["skipped raw item", { status: "skipped", reported: 0, items: [item("hidden", false)] }],
  ["unrecognizable items", { reported: 3, items: [{}, {}, {}] }],
])("treats %s as an incident", (_label, options) => {
  expect(() => classifyLive(envelope(options), DATE, "meme")).toThrow();
});

it("allows repair only when existing visible items remain an exact ordered prefix", () => {
  const first = item("a");
  const second = item("b");
  const live = envelope({ status: "partial", reported: 2, items: [first, second] });
  const candidate = envelope({ status: "partial", items: [first, second, item("c")] });
  expect(() => preserveRepair(live, candidate, DATE, "meme")).not.toThrow();
});

it.each([
  ["reordered", [item("b"), item("a"), item("c")]],
  ["mutated", [{ ...item("a"), title: "changed" }, item("b"), item("c")]],
  ["removed", [item("b"), item("c"), item("d")]],
])("rejects a repair whose visible prefix was %s", (_label, items) => {
  const live = envelope({ status: "partial", reported: 2, items: [item("a"), item("b")] });
  expect(() => preserveRepair(live, envelope({ items }), DATE, "meme")).toThrow();
});

it("ignores unpublished live rows but still preserves visible order", () => {
  const live = envelope({
    status: "partial",
    reported: 2,
    items: [item("a"), item("draft", false), item("b")],
  });
  const candidate = envelope({ items: [item("a"), item("b"), item("c")] });
  expect(() => preserveRepair(live, candidate, DATE, "meme")).not.toThrow();
});

it("allows a current-policy migration to replace legacy visible items once", () => {
  const live = envelope({
    date: CURRENT_DATE,
    policy: "v3-dynamic-selection",
    items: [item("old-a"), item("old-b"), item("old-c")],
  });
  const candidate = envelope({
    date: CURRENT_DATE,
    items: [item("new-a"), item("new-b"), item("new-c"), item("new-d")],
    reported: 4,
  });
  expect(() => preserveRepair(live, candidate, CURRENT_DATE, "meme")).not.toThrow();
});

it.each([
  ["meme", "v3-dynamic-selection", MEME_EDITORIAL_POLICY_VERSION],
  ["news", "v2-minimum-three", NEWS_EDITORIAL_POLICY_VERSION],
] as const)(
  "lets a current-day legacy %s envelope below minimum migrate without preserving its prefix",
  (feed, legacyPolicy, currentPolicy) => {
    const live = envelope({
      date: CURRENT_DATE,
      policy: legacyPolicy,
      status: "partial",
      reported: 2,
      items: [item("old-a"), item("old-b")],
    });
    const candidate = envelope({
      date: CURRENT_DATE,
      policy: currentPolicy,
      status: "partial",
      items: [item("new-a"), item("new-b"), item("new-c")],
    });
    expect(classifyLive(live, CURRENT_DATE, feed)).toMatchObject({
      action: "repair",
      repairKind: "policy_migration",
    });
    expect(() => preserveRepair(live, candidate, CURRENT_DATE, feed)).not.toThrow();
  },
);

it.each([
  ["meme", MEME_EDITORIAL_POLICY_VERSION],
  ["news", NEWS_EDITORIAL_POLICY_VERSION],
] as const)("keeps a current-day current-policy %s minimum repair prefix-monotonic", (
  feed,
  currentPolicy,
) => {
  const live = envelope({
    date: CURRENT_DATE,
    policy: currentPolicy,
    status: "partial",
    reported: 2,
    items: [item("old-a"), item("old-b")],
  });
  const replacement = envelope({
    date: CURRENT_DATE,
    policy: currentPolicy,
    status: "partial",
    items: [item("new-a"), item("new-b"), item("new-c")],
  });
  expect(classifyLive(live, CURRENT_DATE, feed)).toMatchObject({
    action: "repair",
    repairKind: "minimum",
  });
  expect(() => preserveRepair(live, replacement, CURRENT_DATE, feed)).toThrow(
    "changed or reordered visible item at index 0",
  );
});

it("returns a non-zero CLI result for held live data", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "daily-publish-gate-"));
  const file = path.join(fixture, "held.json");
  const live = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "daily", `${DATE}.json`), "utf8"),
  ) as Record<string, unknown>;
  live.status = "held";
  fs.writeFileSync(file, JSON.stringify(live));
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", SCRIPT, "classify-live", file, DATE, "meme"],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  fs.rmSync(fixture, { recursive: true, force: true });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("held live envelope is an incident");
});

it("keeps every extracted publisher run block valid Bash without Node heredocs", () => {
  const workflow = fs.readFileSync(WORKFLOW, "utf8");
  expect(workflow).not.toContain("<<'NODE'");
  expect(workflow).not.toContain("<<NODE");
  const blocks = workflowRunBlocks(workflow);
  expect(blocks.length).toBeGreaterThan(0);
  for (const block of blocks) {
    const result = spawnSync("bash", ["-n"], { input: block, encoding: "utf8" });
    expect(result.status, result.stderr).toBe(0);
  }
});
