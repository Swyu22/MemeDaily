/**
 * input: trusted publisher workflow text and valid current-policy daily fixtures
 * output: historical create-only, evaluation-clock, and real publish-time regressions
 * pos: security and chronology coverage for bounded one-file historical publication
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";
import { dailyNewsEditorialIssues } from "../src/domain/dailynews/editorial-policy";
import {
  NewsEnvelopeSchema,
  newsSelectionClockIssues,
  type NewsEnvelope,
} from "../src/domain/dailynews/schema";
import { dynamicSelectionIssues } from "../src/domain/memedaily/dynamic-selection";
import {
  DailyEnvelopeSchema,
  MEME_EDITORIAL_POLICY_VERSION,
  memeSelectionClockIssues,
  type DailyEnvelope,
} from "../src/domain/memedaily/schema";
import { validateCandidate } from "./daily-publish-gate";
import { normalizePublishTimes } from "./stamp-publish-time";

const ROOT = process.cwd();
const WORKFLOW = path.join(ROOT, ".github/workflows/codex-daily-pr-publish.yml");
const PUBLISH_GATE = path.join(ROOT, "scripts/daily-publish-gate.ts");
const HISTORICAL_DATE = "2026-08-10";
const PUBLISHER_DATE = "2026-08-21";
const REAL_PUBLISH_TIME = `${PUBLISHER_DATE}T12:00:00+08:00`;

function readMeme(): DailyEnvelope {
  const file = path.join(ROOT, "data/daily", `${HISTORICAL_DATE}.json`);
  return DailyEnvelopeSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
}

function readNews(): NewsEnvelope {
  const file = path.join(ROOT, "data/daily-news", `${HISTORICAL_DATE}.json`);
  return NewsEnvelopeSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
}

function historicalMeme(): DailyEnvelope {
  const envelope = readMeme();
  const selection = envelope.run_report.selection!;
  selection.evaluated_at = `${HISTORICAL_DATE}T08:00:00+08:00`;
  envelope.generated_at = REAL_PUBLISH_TIME;
  envelope.published_at = REAL_PUBLISH_TIME;
  return envelope;
}

function historicalNews(): NewsEnvelope {
  const envelope = readNews();
  const selection = envelope.run_report.selection!;
  selection.evaluated_at = `${HISTORICAL_DATE}T08:00:00+08:00`;
  envelope.generated_at = REAL_PUBLISH_TIME;
  envelope.published_at = REAL_PUBLISH_TIME;
  return envelope;
}

function gateEnvelope(evaluatedAt?: string): Record<string, unknown> {
  return {
    policy_version: MEME_EDITORIAL_POLICY_VERSION,
    date: HISTORICAL_DATE,
    status: "published",
    run_report: {
      published: 3,
      selection: { editorial_complete: true, evaluated_at: evaluatedAt },
    },
    items: ["a", "b", "c"].map((id) => ({ id, published: true })),
  };
}

it("uses evaluated_at for historical meme and news qualification", () => {
  const meme = historicalMeme();
  const news = historicalNews();
  expect(dynamicSelectionIssues([meme])).toEqual([]);
  expect(dailyNewsEditorialIssues(news)).toEqual([]);

  delete meme.run_report.selection!.evaluated_at;
  delete news.run_report.selection!.evaluated_at;
  expect(dynamicSelectionIssues([meme]).some((issue) => issue.includes("outside"))).toBe(true);
  expect(dailyNewsEditorialIssues(news).some((issue) => issue.includes("qualification_tier"))).toBe(true);
});

it("requires the evaluation clock to match the envelope date and precede trusted clocks", () => {
  const meme = historicalMeme();
  const news = historicalNews();
  meme.run_report.selection!.evaluated_at = "2026-08-11T08:00:00+08:00";
  news.run_report.selection!.evaluated_at = "2026-08-22T08:00:00+08:00";
  expect(memeSelectionClockIssues(meme)).toContain(
    `${HISTORICAL_DATE} selection evaluated_at must fall on the envelope date`,
  );
  expect(newsSelectionClockIssues(news)).toEqual(expect.arrayContaining([
    `${HISTORICAL_DATE} selection evaluated_at must fall on the envelope date`,
    `${HISTORICAL_DATE} selection evaluated_at is after generated_at`,
    `${HISTORICAL_DATE} selection evaluated_at is after published_at`,
  ]));
});

it("keeps evaluated_at while stamping the real current publication time", () => {
  const meme = historicalMeme();
  const evaluatedAt = meme.run_report.selection!.evaluated_at;
  const stamped = normalizePublishTimes(meme, "2026-08-21T12:30:00+08:00");
  expect(stamped.run_report.selection?.evaluated_at).toBe(evaluatedAt);
  expect(stamped.generated_at).toBe("2026-08-21T12:30:00+08:00");
  expect(stamped.published_at).toBe("2026-08-21T12:30:00+08:00");
});

it("requires evaluated_at for a historical publisher candidate", () => {
  expect(() => validateCandidate(
    gateEnvelope(), HISTORICAL_DATE, "meme", PUBLISHER_DATE,
  )).toThrow("historical candidate must declare run_report.selection.evaluated_at");
  expect(() => validateCandidate(
    gateEnvelope(`${HISTORICAL_DATE}T08:00:00+08:00`),
    HISTORICAL_DATE,
    "meme",
    PUBLISHER_DATE,
  )).not.toThrow();
});

it("keeps the existing three-argument validate-candidate CLI compatible", () => {
  const file = path.join(ROOT, "data/daily", `${HISTORICAL_DATE}.json`);
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", PUBLISH_GATE, "validate-candidate", file, HISTORICAL_DATE, "meme"],
    { cwd: ROOT, encoding: "utf8" },
  );
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain("candidate-ok");
});

it("confines historical branches to valid missing dates without widening trust", () => {
  const workflow = fs.readFileSync(WORKFLOW, "utf8");
  expect(workflow).toContain("^codex/daily-(meme|news)-([0-9]{4}-[0-9]{2}-[0-9]{2})$");
  expect(workflow).toContain('MINIMUM_DATE="2026-07-26"');
  expect(workflow).toContain('[[ "$DATE" < "$MINIMUM_DATE" || "$DATE" > "$TODAY" ]]');
  expect(workflow).toContain('git cat-file -e "HEAD:${TARGET}"');
  expect(workflow).toContain("Historical publication is create-only");
  expect(workflow).toContain('validate-candidate "$TARGET" "$DATE" "$FEED" "$TODAY"');
  expect(workflow).toContain('LIVE_TODAY="$(TZ=Asia/Shanghai date +%F)"');
  expect(workflow).toContain('validate-candidate "$TARGET" "$DATE" "$FEED" "$LIVE_TODAY"');
  expect(workflow).toContain('"${#CHANGED_FILES[@]}" -ne 1');
  expect(workflow).not.toContain("contents: write");
});
