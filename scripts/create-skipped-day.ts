/**
 * input: optional MEMEDAILY_DATE=YYYY-MM-DD and data/daily directory
 * output: no-op only for a complete target; otherwise fails and requests editorial recovery
 * pos: fail-closed fallback guard that prevents automatic zero-item meme publication
 */
import fs from "node:fs";
import path from "node:path";
import { DailyEnvelopeSchema } from "../src/domain/memedaily/schema";
import { visibleItems } from "../src/domain/memedaily/rules";
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

const dataDir = path.join(process.cwd(), "data", "daily");
const { targetDate, filePath } = resolveFallbackTarget(
  dataDir,
  process.env.MEMEDAILY_DATE ?? shanghaiDate(),
);

if (!fs.existsSync(filePath)) {
  throw new Error(
    `[fallback] ${targetDate} is missing. Automatic skipped envelopes are disabled; ` +
      "run an editorial fallback and publish at least 3 independently verified items. " +
      "Never pad, fabricate, or relax safety/politics/privacy red lines.",
  );
}

const envelope = DailyEnvelopeSchema.parse(JSON.parse(fs.readFileSync(filePath, "utf8")));
const visible = visibleItems(envelope).length;
const complete =
  envelope.date === targetDate &&
  (envelope.status === "published" || envelope.status === "partial") &&
  envelope.run_report.published === visible &&
  visible >= 3;

if (!complete) {
  throw new Error(
    `[fallback] ${targetDate} is under minimum or malformed ` +
      `(status=${envelope.status}, reported=${envelope.run_report.published}, visible=${visible}); ` +
      "run editorial recovery to at least 3 verified items.",
  );
}

console.log(`[fallback] ${targetDate} is complete (${visible}/3); no action`);
