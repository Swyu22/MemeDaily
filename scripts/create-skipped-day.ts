/**
 * input: optional MEMEDAILY_DATE=YYYY-MM-DD and data/daily directory
 * output: no-op for an existing target; otherwise fails and requests editorial recovery
 * pos: fail-closed fallback guard that prevents automatic zero-item meme publication
 */
import fs from "node:fs";
import path from "node:path";
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

if (fs.existsSync(filePath)) {
  console.log(`[fallback] ${targetDate} already exists; no action`);
  process.exit(0);
}

throw new Error(
  `[fallback] ${targetDate} is missing. Automatic skipped envelopes are disabled; ` +
    "run an editorial fallback and publish at least 3 independently verified items. " +
    "Never pad, fabricate, or relax safety/politics/privacy red lines.",
);
