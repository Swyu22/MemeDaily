/**
 * input: optional DAILYNEWS_DATE=YYYY-MM-DD and data/daily-news directory
 * output: no-op only for a complete target; otherwise fails and requests editorial recovery
 * pos: fail-closed fallback guard that prevents automatic zero-item news publication
 */
import fs from "node:fs";
import path from "node:path";
import {
  NEWS_EDITORIAL_POLICY_VERSION,
  NewsEnvelopeSchema,
} from "../src/domain/dailynews/schema";
import { visibleNews } from "../src/domain/dailynews/rules";
import { resolveFallbackTarget } from "./fallback-target";

function shanghaiDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  const year = get("year");
  const month = get("month");
  const day = get("day");
  if (!year || !month || !day) {
    throw new Error("Intl.DateTimeFormat did not return year/month/day parts");
  }
  return `${year}-${month}-${day}`;
}

const dataDir = path.join(process.cwd(), "data", "daily-news");
const { targetDate, filePath } = resolveFallbackTarget(
  dataDir,
  process.env.DAILYNEWS_DATE ?? shanghaiDate(),
);

if (!fs.existsSync(filePath)) {
  throw new Error(
    `[news-fallback] ${targetDate} is missing. Automatic skipped envelopes are disabled; ` +
      "run an editorial fallback and publish at least 3 independently verified items. " +
      "Never pad, fabricate, or relax safety/politics/privacy red lines.",
  );
}

const envelope = NewsEnvelopeSchema.parse(JSON.parse(fs.readFileSync(filePath, "utf8")));
const visible = visibleNews(envelope).length;
const editorialComplete =
  targetDate < "2026-08-01" ||
  (envelope.policy_version === NEWS_EDITORIAL_POLICY_VERSION &&
    envelope.run_report.selection?.editorial_complete === true);
const complete =
  envelope.date === targetDate &&
  (envelope.status === "published" || envelope.status === "partial") &&
  envelope.run_report.published === visible &&
  visible >= 3 &&
  editorialComplete;

if (!complete) {
  throw new Error(
    `[news-fallback] ${targetDate} is under minimum, legacy-policy, or malformed ` +
      `(status=${envelope.status}, reported=${envelope.run_report.published}, visible=${visible}, ` +
      `editorial_complete=${editorialComplete}); run a complete editorial recovery.`,
  );
}

console.log(`[news-fallback] ${targetDate} is editorially complete (${visible}/3..10); no action`);
