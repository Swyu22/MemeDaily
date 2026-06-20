/**
 * input: parsed MemeDaily envelopes and items
 * output: deterministic publication gate decisions
 * pos: domain policy layer for evidence thresholds and display status
 */
import type { DailyEnvelope, EvidenceTier, MemeItem } from "./schema";

const primaryEvidenceTiers: EvidenceTier[] = ["platform_public", "aggregator"];

export function hasPublishableEvidence(item: MemeItem): boolean {
  const uniqueUrls = new Set(item.sources.map((source) => source.url));
  const hasPrimary = item.sources.some((source) =>
    primaryEvidenceTiers.includes(source.tier),
  );

  return uniqueUrls.size >= 2 && hasPrimary;
}

export function visibleItems(envelope: DailyEnvelope): MemeItem[] {
  if (envelope.status === "held" || envelope.status === "skipped") {
    return [];
  }

  return envelope.items.filter((item) => item.published && hasPublishableEvidence(item));
}

function normalizeName(value: string): string {
  return Array.from(value.toLowerCase())
    .filter((ch) => /[\p{L}\p{N}]/u.test(ch))
    .join("");
}

/**
 * Cross-day freshness gate: a meme that already appeared (by normalized
 * title/alias) on an earlier day must carry days_on_list >= 2, so the daily
 * agent cannot silently re-pitch a prior meme as brand new.
 *
 * Scope notes: only user-VISIBLE prior appearances seed the history, so a meme
 * previously held/skipped/unpublished (never shown) is intentionally not treated
 * as a re-pitch. Matching is by normalized title/alias, so two genuinely distinct
 * memes that share a short alias can collide — accepted as a rare, low-cost
 * false positive. Same-day duplicates are handled separately in
 * envelopeIssueSummary.
 */
export function crossDayIssues(envelopes: DailyEnvelope[]): string[] {
  const issues: string[] = [];
  const firstDateForName = new Map<string, string>();
  const byDateAsc = [...envelopes].sort((a, b) => a.date.localeCompare(b.date));

  for (const envelope of byDateAsc) {
    for (const item of visibleItems(envelope)) {
      const names = Array.from(
        new Set([item.title, ...item.aliases].map(normalizeName).filter(Boolean)),
      );

      let firstSeen: string | undefined;
      for (const name of names) {
        const prev = firstDateForName.get(name);
        if (prev && prev < envelope.date && (!firstSeen || prev < firstSeen)) {
          firstSeen = prev;
        }
      }

      if (firstSeen && (item.days_on_list === undefined || item.days_on_list < 2)) {
        issues.push(
          `${item.id} repeats a meme first seen on ${firstSeen} but days_on_list is ${
            item.days_on_list ?? "unset"
          } (expected >= 2)`,
        );
      }

      for (const name of names) {
        if (!firstDateForName.has(name)) {
          firstDateForName.set(name, envelope.date);
        }
      }
    }
  }

  return issues;
}

export function envelopeIssueSummary(envelope: DailyEnvelope): string[] {
  const issues: string[] = [];

  if (envelope.status === "published" && envelope.items.length === 0) {
    issues.push("published envelope cannot have zero items");
  }

  for (const item of envelope.items) {
    if (!hasPublishableEvidence(item)) {
      issues.push(`${item.id} lacks publishable evidence`);
    }
  }

  if (envelope.run_report.published !== visibleItems(envelope).length) {
    issues.push("run_report.published does not match visible item count");
  }

  // Same-day duplicates: two visible items that are the same meme (by normalized
  // title/alias) within one envelope. crossDayIssues only covers earlier days.
  const seenNames = new Map<string, string>();
  for (const item of visibleItems(envelope)) {
    const names = Array.from(
      new Set([item.title, ...item.aliases].map(normalizeName).filter(Boolean)),
    );
    for (const name of names) {
      const prior = seenNames.get(name);
      if (prior && prior !== item.id) {
        issues.push(`${item.id} duplicates "${name}" already published today by ${prior}`);
      } else if (!seenNames.has(name)) {
        seenNames.set(name, item.id);
      }
    }
  }

  return issues;
}
