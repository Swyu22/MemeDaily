/**
 * input: synthetic per-feed archive file-name inventories
 * output: regressions for cutoff-bounded, feed-local date-continuity detection
 * pos: unit coverage for the dual-feed archive continuity gate
 */
import { expect, it } from "vitest";
import { dateContinuityIssues } from "./data-continuity";

it("reports every missing date inside the cutoff-to-maximum interval", () => {
  const issues = dateContinuityIssues([
    "2026-07-26.json",
    "2026-07-28.json",
    "2026-07-30.json",
  ]);

  expect(issues).toEqual([
    "missing archive date 2026-07-27",
    "missing archive date 2026-07-29",
  ]);
});

it("ignores gaps and files before the continuity cutoff", () => {
  const issues = dateContinuityIssues([
    "2026-07-01.json",
    "2026-07-25.json",
    "2026-07-26.json",
  ]);

  expect(issues).toEqual([]);
});

it("accepts a continuous archive through that feed maximum", () => {
  const issues = dateContinuityIssues([
    "2026-07-26.json",
    "2026-07-27.json",
    "2026-07-28.json",
  ]);

  expect(issues).toEqual([]);
});

it("evaluates each feed against its own dates and maximum", () => {
  const memeIssues = dateContinuityIssues([
    "2026-07-26.json",
    "2026-07-28.json",
  ]);
  const newsIssues = dateContinuityIssues([
    "2026-07-26.json",
    "2026-07-27.json",
  ]);

  expect(memeIssues).toEqual(["missing archive date 2026-07-27"]);
  expect(newsIssues).toEqual([]);
});
