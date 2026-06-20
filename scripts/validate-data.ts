/**
 * input: data/daily/*.json
 * output: exits non-zero when schema or publication gates fail
 * pos: CI/local gate before static build and daily automation commit
 */
import { dailyJsonFiles, loadEnvelope } from "../src/domain/memedaily/data";
import { envelopeIssueSummary } from "../src/domain/memedaily/rules";

const files = dailyJsonFiles();

if (files.length === 0) {
  console.error("[validate-data] no data/daily/YYYY-MM-DD.json files found");
  process.exit(1);
}

let failureCount = 0;

for (const file of files) {
  try {
    const envelope = loadEnvelope(file);
    const issues = envelopeIssueSummary(envelope);

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

if (failureCount > 0) {
  console.error(`[validate-data] failed with ${failureCount} issue(s)`);
  process.exit(1);
}
