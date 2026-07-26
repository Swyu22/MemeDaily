/**
 * input: isolated temporary workspaces and fallback/date validator CLIs
 * output: regressions for empty DailyNews data and fail-closed fallback/date handling
 * pos: subprocess-level safety coverage for trusted data maintenance scripts
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveFallbackTarget } from "./fallback-target";

const repoRoot = process.cwd();
const tsxPath = path.join(repoRoot, "node_modules", ".bin", "tsx");
const tempRoots: string[] = [];

function tempRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "memedaily-data-test-"));
  tempRoots.push(root);
  return root;
}

function runScript(
  script: string,
  cwd: string,
  env: Record<string, string | undefined> = {},
) {
  return spawnSync(tsxPath, [path.join(repoRoot, "scripts", script)], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    fs.rmSync(root, { force: true, recursive: true });
  }
});

it("fails validation when the initialized DailyNews store is absent", () => {
  const result = runScript("validate-news.ts", tempRoot());

  expect(result.status).toBe(1);
  expect(result.stderr).toContain("no data/daily-news/YYYY-MM-DD.json files found");
});

describe("fallback target safety", () => {
  it.each(["2026-7-25", "../2026-07-25", "2026-02-30"])(
    "rejects invalid date %s",
    (date) => {
      expect(() => resolveFallbackTarget("/tmp/memedaily/daily", date)).toThrow();
    },
  );

  it("returns only a direct child of the requested data directory", () => {
    const target = resolveFallbackTarget("/tmp/memedaily/daily", "2026-07-25");

    expect(target.targetDate).toBe("2026-07-25");
    expect(target.filePath).toBe("/tmp/memedaily/daily/2026-07-25.json");
  });
});

it.each([
  {
    script: "create-skipped-day.ts",
    variable: "MEMEDAILY_DATE",
    directory: "daily",
  },
  {
    script: "create-skipped-news-day.ts",
    variable: "DAILYNEWS_DATE",
    directory: "daily-news",
  },
])("fails closed without creating a skipped envelope via $script", ({ script, variable, directory }) => {
  const root = tempRoot();
  const result = runScript(script, root, { [variable]: "2026-07-26" });
  const filePath = path.join(root, "data", directory, "2026-07-26.json");

  expect(result.status).not.toBe(0);
  expect(`${result.stdout}${result.stderr}`).toContain(
    "Automatic skipped envelopes are disabled",
  );
  expect(`${result.stdout}${result.stderr}`).toContain(
    "publish at least 3 independently verified items",
  );
  expect(fs.existsSync(filePath)).toBe(false);
  expect(fs.existsSync(path.join(root, "data"))).toBe(false);
});

it.each([
  {
    script: "create-skipped-day.ts",
    variable: "MEMEDAILY_DATE",
    directory: "daily",
  },
  {
    script: "create-skipped-news-day.ts",
    variable: "DAILYNEWS_DATE",
    directory: "daily-news",
  },
])("leaves an existing target untouched via $script", ({ script, variable, directory }) => {
  const root = tempRoot();
  const targetDir = path.join(root, "data", directory);
  const filePath = path.join(targetDir, "2026-07-26.json");
  const original = '{"sentinel":"existing editorial result"}\n';
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(filePath, original);

  const result = runScript(script, root, { [variable]: "2026-07-26" });

  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain("already exists; no action");
  expect(fs.readFileSync(filePath, "utf8")).toBe(original);
});

it.each([
  ["create-skipped-day.ts", "MEMEDAILY_DATE"],
  ["create-skipped-news-day.ts", "DAILYNEWS_DATE"],
])("rejects traversal input before %s writes", (script, variable) => {
  const root = tempRoot();
  const result = runScript(script, root, { [variable]: "../../escaped" });

  expect(result.status).not.toBe(0);
  expect(`${result.stdout}${result.stderr}`).toContain("fallback date must use YYYY-MM-DD");
  expect(fs.existsSync(path.join(root, "data"))).toBe(false);
});
