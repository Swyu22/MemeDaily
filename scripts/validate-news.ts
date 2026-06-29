/**
 * input: data/daily-news/*.json
 * output: exits non-zero when schema or publication gates fail
 * pos: CI/local gate for the 日报 feed, before static build and daily automation commit
 *
 * Unlike validate-data.ts (which requires >=1 meme file), this TOLERATES an empty/absent
 * data/daily-news/ directory and exits 0 — so CI is not blocked before the news agent's
 * first run ever produces a file.
 */
import { newsJsonFiles, loadNewsEnvelope } from "../src/domain/dailynews/data";
import { envelopeIssueSummary } from "../src/domain/dailynews/rules";

const files = newsJsonFiles();

if (files.length === 0) {
  console.log("[validate-news] no data/daily-news files yet — skipping (ok)");
  process.exit(0);
}

let failureCount = 0;

for (const file of files) {
  try {
    const envelope = loadNewsEnvelope(file);
    const issues = envelopeIssueSummary(envelope);

    if (issues.length > 0) {
      failureCount += issues.length;
      console.error(`[validate-news] ${file}`);
      for (const issue of issues) {
        console.error(`  - ${issue}`);
      }
    } else {
      console.log(`[validate-news] ok ${file}`);
    }
  } catch (error) {
    failureCount += 1;
    console.error(`[validate-news] invalid ${file}`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

if (failureCount > 0) {
  console.error(`[validate-news] failed with ${failureCount} issue(s)`);
  process.exit(1);
}
