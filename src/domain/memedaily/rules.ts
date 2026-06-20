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

  return issues;
}
