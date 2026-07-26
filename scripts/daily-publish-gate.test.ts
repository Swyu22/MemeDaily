/**
 * input: structural daily-envelope fixtures at the trusted candidate/live publication boundary
 * output: regression coverage for minimum-three acceptance, incident detection, and append-only repair
 * pos: deterministic unit contract for scripts/daily-publish-gate.ts
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";
import {
  classifyLive,
  preserveRepair,
  validateCandidate,
} from "./daily-publish-gate";

const DATE = "2026-07-26";
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
};

function item(id: string, published = true): Record<string, unknown> {
  return { id, title: `item-${id}`, published };
}

function envelope(options: FixtureOptions = {}): Record<string, unknown> {
  return {
    date: options.date ?? DATE,
    status: options.status ?? "published",
    run_report: { published: options.reported ?? 3 },
    items: options.items ?? [item("a"), item("b"), item("c")],
  };
}

function workflowRunBlocks(text: string): string[] {
  const lines = text.split("\n");
  const blocks: string[] = [];
  for (let index = 0; index < lines.length; index++) {
    const marker = lines[index]?.match(/^(\s*)run:\s*\|\s*$/);
    if (!marker) continue;
    const baseIndent = marker[1]?.length ?? 0;
    const block: string[] = [];
    while (++index < lines.length) {
      const line = lines[index] ?? "";
      const indent = line.match(/^\s*/)?.[0].length ?? 0;
      if (line.trim() && indent <= baseIndent) {
        index--;
        break;
      }
      block.push(line.slice(Math.min(line.length, baseIndent + 2)));
    }
    blocks.push(block.join("\n"));
  }
  return blocks;
}

it("accepts a candidate only when its date, status, count, and minimum agree", () => {
  const result = validateCandidate(envelope(), DATE);
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
  expect(() => validateCandidate(envelope(options), DATE)).toThrow();
});

it("classifies a well-formed empty skipped day as repairable", () => {
  const result = classifyLive(envelope({ status: "skipped", reported: 0, items: [] }), DATE);
  expect(result.action).toBe("repair");
});

it.each([
  [0, "repair"],
  [1, "repair"],
  [2, "repair"],
  [3, "terminal"],
  [7, "terminal"],
])("classifies a count-consistent published live day with %i items as %s", (count, action) => {
  const items = Array.from({ length: count }, (_, index) => item(String(index)));
  expect(classifyLive(envelope({ reported: count, items }), DATE).action).toBe(action);
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
  expect(() => classifyLive(envelope(options), DATE)).toThrow();
});

it("allows repair only when existing visible items remain an exact ordered prefix", () => {
  const first = item("a");
  const second = item("b");
  const live = envelope({ status: "partial", reported: 2, items: [first, second] });
  const candidate = envelope({ status: "partial", items: [first, second, item("c")] });
  expect(() => preserveRepair(live, candidate, DATE)).not.toThrow();
});

it.each([
  ["reordered", [item("b"), item("a"), item("c")]],
  ["mutated", [{ ...item("a"), title: "changed" }, item("b"), item("c")]],
  ["removed", [item("b"), item("c"), item("d")]],
])("rejects a repair whose visible prefix was %s", (_label, items) => {
  const live = envelope({ status: "partial", reported: 2, items: [item("a"), item("b")] });
  expect(() => preserveRepair(live, envelope({ items }), DATE)).toThrow();
});

it("ignores unpublished live rows but still preserves visible order", () => {
  const live = envelope({
    status: "partial",
    reported: 2,
    items: [item("a"), item("draft", false), item("b")],
  });
  const candidate = envelope({ items: [item("a"), item("b"), item("c")] });
  expect(() => preserveRepair(live, candidate, DATE)).not.toThrow();
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
