/**
 * input: fallback data directory and a requested YYYY-MM-DD date
 * output: validated date plus a contained direct-child JSON path
 * pos: shared path-safety boundary for both skipped-envelope generators
 */
import path from "node:path";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validatedDate(value: string): string {
  if (!DATE_RE.test(value)) {
    throw new Error(`fallback date must use YYYY-MM-DD: ${value}`);
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`fallback date is not a real calendar date: ${value}`);
  }
  return value;
}

export function resolveFallbackTarget(
  dataDir: string,
  requestedDate: string,
): { targetDate: string; filePath: string } {
  const targetDate = validatedDate(requestedDate);
  const resolvedDir = path.resolve(dataDir);
  const filePath = path.resolve(resolvedDir, `${targetDate}.json`);
  if (path.dirname(filePath) !== resolvedDir) {
    throw new Error(`fallback target escapes data directory: ${filePath}`);
  }
  return { targetDate, filePath };
}
