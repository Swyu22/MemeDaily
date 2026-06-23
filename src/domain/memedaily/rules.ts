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

function itemNames(item: MemeItem): string[] {
  return Array.from(new Set([item.title, ...item.aliases].map(normalizeName).filter(Boolean)));
}

const DECLINING_MIN_DAYS = 10;

function daysBetween(fromDate: string, toDate: string): number {
  return Math.round((Date.parse(toDate) - Date.parse(fromDate)) / 86_400_000);
}

/**
 * Lifecycle gate: a meme may be labeled `declining` (已过气) only once its topic has
 * been on the site for >= 10 days since its FIRST appearance in data/daily history.
 * Anything newer must be at least `rising`. First-seen is read from retained history;
 * a meme older than the retained window can't be disproven, so it is not flagged.
 */
export function lifecycleIssues(envelopes: DailyEnvelope[]): string[] {
  const issues: string[] = [];
  const byDateAsc = [...envelopes].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = new Map<string, string>();

  for (const envelope of byDateAsc) {
    for (const item of visibleItems(envelope)) {
      for (const name of itemNames(item)) {
        if (!firstDate.has(name)) firstDate.set(name, envelope.date);
      }
    }
  }

  for (const envelope of byDateAsc) {
    for (const item of visibleItems(envelope)) {
      if (item.lifecycle !== "declining") continue;
      let firstSeen: string | undefined;
      for (const name of itemNames(item)) {
        const seen = firstDate.get(name);
        if (seen && (!firstSeen || seen < firstSeen)) firstSeen = seen;
      }
      if (firstSeen && daysBetween(firstSeen, envelope.date) < DECLINING_MIN_DAYS) {
        issues.push(
          `${item.id} is 'declining' but its topic first appeared ${firstSeen} (<${DECLINING_MIN_DAYS} days before ${envelope.date}); use rising/peak`,
        );
      }
    }
  }

  return issues;
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
      const names = itemNames(item);

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

// Code-enforced content policy: 时事政治 must never reach published items, even when memeified
// (prompt rules leak — e.g. a "UK PM" cat meme). High-signal political role/institution terms;
// a hit fails validation so the agent self-corrects and a bad item can never be published.
// High-signal political-SUBJECT markers only — terms whose presence means the item is ABOUT
// politics, not ones a non-political meme might mention in passing (e.g. "议会"/"议员" appear
// when a gesture merely spreads to a parliament). The prompt rule is the primary defense; this
// code gate is the backstop that fails the build on the clear cases (e.g. "英国首相").
const POLITICS_TERMS = [
  "首相", "总统", "总理", "国家主席", "大选", "弹劾", "政变",
  "白宫", "克里姆林", "执政党", "在野党",
];

export function politicalContentIssues(envelope: DailyEnvelope): string[] {
  const issues: string[] = [];
  for (const item of visibleItems(envelope)) {
    const haystack = [
      item.title,
      item.summary,
      item.origin,
      item.usage,
      item.why_spread,
      item.fun_point,
      item.brand_usage,
      ...item.aliases,
    ].join(" ");
    const hit = POLITICS_TERMS.find((term) => haystack.includes(term));
    if (hit) {
      issues.push(`${item.id} contains political term "${hit}" — 时事政治 must be dropped`);
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

  // Temporal invariant: evidence cannot be captured after the envelope was generated.
  const generatedMs = Date.parse(envelope.generated_at);
  for (const item of envelope.items) {
    for (const source of item.sources) {
      if (Date.parse(source.captured_at) > generatedMs) {
        issues.push(
          `${item.id} source captured_at ${source.captured_at} is after generated_at ${envelope.generated_at}`,
        );
      }
    }
  }

  // Same-day duplicates: two visible items that are the same meme (by normalized
  // title/alias) within one envelope. crossDayIssues only covers earlier days.
  const seenNames = new Map<string, string>();
  for (const item of visibleItems(envelope)) {
    const names = itemNames(item);
    for (const name of names) {
      const prior = seenNames.get(name);
      if (prior && prior !== item.id) {
        issues.push(`${item.id} duplicates "${name}" already published today by ${prior}`);
      } else if (!seenNames.has(name)) {
        seenNames.set(name, item.id);
      }
    }
  }

  issues.push(...politicalContentIssues(envelope));

  return issues;
}
