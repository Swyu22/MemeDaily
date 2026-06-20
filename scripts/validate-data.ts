/**
 * input: data/daily/*.json
 * output: exits non-zero when schema or publication gates fail
 * pos: CI/local gate before static build and daily automation commit
 */
import { dailyJsonFiles, loadEnvelope } from "../src/domain/memedaily/data";
import {
  crossDayIssues,
  envelopeIssueSummary,
  lifecycleIssues,
} from "../src/domain/memedaily/rules";
import type { DailyEnvelope } from "../src/domain/memedaily/schema";

const files = dailyJsonFiles();

if (files.length === 0) {
  console.error("[validate-data] no data/daily/YYYY-MM-DD.json files found");
  process.exit(1);
}

let failureCount = 0;
const envelopes: DailyEnvelope[] = [];

for (const file of files) {
  try {
    const envelope = loadEnvelope(file);
    const issues = envelopeIssueSummary(envelope);
    envelopes.push(envelope);

    if (issues.length > 0) {
      failureCount += issues.length;
      console.error(`[validate-data] ${file}`);
      for (const issue of issues) {
        console.error(`  - ${issue}`);
      }
    } else {
      console.log(`[validate-data] ok ${file}`);
    }
  } catch (error) {
    failureCount += 1;
    console.error(`[validate-data] invalid ${file}`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

if (failureCount === 0) {
  const crossDay = crossDayIssues(envelopes);
  if (crossDay.length > 0) {
    failureCount += crossDay.length;
    console.error("[validate-data] cross-day freshness issues");
    for (const issue of crossDay) {
      console.error(`  - ${issue}`);
    }
  } else {
    console.log("[validate-data] ok cross-day freshness");
  }

  const lifecycle = lifecycleIssues(envelopes);
  if (lifecycle.length > 0) {
    failureCount += lifecycle.length;
    console.error("[validate-data] lifecycle (10-day declining) issues");
    for (const issue of lifecycle) {
      console.error(`  - ${issue}`);
    }
  } else {
    console.log("[validate-data] ok lifecycle (10-day declining rule)");
  }
}

if (failureCount > 0) {
  console.error(`[validate-data] failed with ${failureCount} issue(s)`);
  process.exit(1);
}
