/**
 * input: dated JSON archive file names for one feed
 * output: every missing date from the shared cutoff through that feed's own maximum date
 * pos: pure archive-continuity contract shared by both data validators
 */
export const DAILY_CONTINUITY_START_DATE = "2026-07-26";

const DATE_FILE_PATTERN = /^(\d{4}-\d{2}-\d{2})\.json$/;

function archiveDate(fileName: string): string | null {
  const match = DATE_FILE_PATTERN.exec(fileName);
  if (!match) return null;
  const value = match[1];
  if (!value) return null;
  return normalizedDate(value);
}

function normalizedDate(value: string): string | null {
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(timestamp)) return null;
  if (new Date(timestamp).toISOString().slice(0, 10) !== value) return null;
  return value;
}

function nextDate(value: string): string {
  const cursor = new Date(`${value}T00:00:00Z`);
  cursor.setUTCDate(cursor.getUTCDate() + 1);
  return cursor.toISOString().slice(0, 10);
}

function sortedArchiveDates(fileNames: readonly string[]): string[] {
  const dates: string[] = [];
  for (const fileName of fileNames) {
    const date = archiveDate(fileName);
    if (date) dates.push(date);
  }
  return dates.sort();
}

function missingDatesBetween(dates: string[], startDate: string, maximumDate: string): string[] {
  const knownDates = new Set(dates);
  const issues: string[] = [];
  for (let date = startDate; date <= maximumDate; date = nextDate(date)) {
    if (!knownDates.has(date)) issues.push(`missing archive date ${date}`);
  }
  return issues;
}

export function dateContinuityIssues(
  fileNames: readonly string[],
  startDate = DAILY_CONTINUITY_START_DATE,
): string[] {
  const dates = sortedArchiveDates(fileNames);
  const maximumDate = dates.at(-1);
  if (!maximumDate) return [];
  if (maximumDate < startDate) return [];
  return missingDatesBetween(dates, startDate, maximumDate);
}
