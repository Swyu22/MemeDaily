/**
 * input: parsed MemeDaily envelopes dated 2026-07-27 or later
 * output: deterministic score, activity, identity, tier-selection, and completeness issues
 * pos: dynamic editorial-selection policy layered on the core meme evidence rules
 */
import { editorialCompletenessIssues } from "./editorial-completeness";
import {
  memeSelectionClockIssues,
  memeSelectionClockMs,
  type DailyEnvelope,
  type MemeItem,
} from "./schema";
import { visibleItems } from "./rules";

const DYNAMIC_SELECTION_DATE = "2026-07-27";
const MINIMUM_CANDIDATE_POOL = 30;
const MINIMUM_VISIBLE_ITEMS = 3;
const MINIMUM_REUSABILITY_SCORE = 16;
const MINIMUM_EVIDENCE_SCORE = 7;
const OPAQUE_SAFETY_KEY = /^candidate-\d+$/;
const SELECTION_RULES = {
  strict_24h: { minimumScore: 75, maximumAgeHours: 24, status: "published" },
  relaxed_48h: { minimumScore: 70, maximumAgeHours: 48, status: "partial" },
  relaxed_72h: { minimumScore: 65, maximumAgeHours: 72, status: "partial" },
} as const;

type SelectionTier = keyof typeof SELECTION_RULES;
type Selection = NonNullable<DailyEnvelope["run_report"]["selection"]>;
type QualifiedCounts = Selection["qualified"];
type CandidateAudit = Selection["candidate_audit"][number];
type CandidateOutcome = CandidateAudit["outcome"];
type Occurrence = { date: string; item: MemeItem; selectionMs: number };

function normalizeName(value: string): string {
  return Array.from(value.toLowerCase())
    .filter((ch) => /[\p{L}\p{N}]/u.test(ch))
    .join("");
}

function itemNames(item: MemeItem): string[] {
  const values = [item.title, ...item.aliases, item.canonical_phrase ?? ""];
  const names = values.map(normalizeName).filter(Boolean);
  return Array.from(new Set(names));
}

function selectionTier(envelope: DailyEnvelope): SelectionTier | undefined {
  return envelope.run_report.selection?.tier;
}

function candidatePoolIssues(envelope: DailyEnvelope): string[] {
  if (envelope.run_report.candidates_scanned >= MINIMUM_CANDIDATE_POOL) return [];
  return [
    `${envelope.date} ranked ${envelope.run_report.candidates_scanned} candidates; expected >=${MINIMUM_CANDIDATE_POOL}`,
  ];
}

function selectionDeclarationIssues(
  envelope: DailyEnvelope,
  tier: SelectionTier | undefined,
): string[] {
  if (!tier) return [`${envelope.date} is missing run_report.selection.tier`];
  const expectedStatus = SELECTION_RULES[tier].status;
  if (envelope.status === expectedStatus) return [];
  return [`${envelope.date} selection ${tier} requires status ${expectedStatus}`];
}

function dynamicEnvelopeIssues(envelope: DailyEnvelope): string[] {
  if (envelope.date < DYNAMIC_SELECTION_DATE || envelope.status === "held") return [];
  const tier = selectionTier(envelope);
  return [
    ...candidatePoolIssues(envelope),
    ...selectionDeclarationIssues(envelope, tier),
    ...candidateAuditIssues(envelope, tier),
    ...selectionAccountingIssues(envelope, tier),
  ];
}

function scoreTotal(item: MemeItem): number | undefined {
  const parts = item.score_breakdown;
  if (!parts) return undefined;
  return parts.heat + parts.freshness + parts.reusability + parts.evidence;
}

function scoreShapeIssues(item: MemeItem, total: number | undefined): string[] {
  if (total === undefined) return [`${item.id} is missing score or score_breakdown`];
  if (item.score === undefined) return [`${item.id} is missing score or score_breakdown`];
  if (item.score === total) return [];
  return [`${item.id} score ${item.score} does not equal ${total}`];
}

function scoreFloorIssues(
  item: MemeItem,
  total: number | undefined,
  tier: SelectionTier,
): string[] {
  if (total === undefined) return [];
  if (total >= SELECTION_RULES[tier].minimumScore) return [];
  return [`${item.id} score ${total} is below ${tier} floor`];
}

function scoreComponentIssues(item: MemeItem): string[] {
  const parts = item.score_breakdown;
  if (!parts) return [];
  const issues: string[] = [];
  if (parts.reusability < MINIMUM_REUSABILITY_SCORE) {
    issues.push(`${item.id} reusability score is below ${MINIMUM_REUSABILITY_SCORE}`);
  }
  if (parts.evidence < MINIMUM_EVIDENCE_SCORE) {
    issues.push(`${item.id} evidence score is below ${MINIMUM_EVIDENCE_SCORE}`);
  }
  return issues;
}

function canonicalShapeIssues(item: MemeItem): string[] {
  const canonical = normalizeName(item.canonical_phrase ?? "");
  if (!canonical) return [`${item.id} canonical_phrase has no stable letters or numbers`];
  const displayNames = [item.title, ...item.aliases].map(normalizeName);
  if (displayNames.includes(canonical)) return [];
  return [`${item.id} title or aliases must anchor canonical_phrase`];
}

function scoreIssues(item: MemeItem, tier: SelectionTier): string[] {
  const total = scoreTotal(item);
  return [
    ...canonicalShapeIssues(item),
    ...scoreShapeIssues(item, total),
    ...scoreFloorIssues(item, total, tier),
    ...scoreComponentIssues(item),
  ];
}

function sourceObservationMs(
  item: MemeItem,
  source: MemeItem["sources"][number],
  chronologyIssues: string[],
): number | undefined {
  if (!source.observed_at) return undefined;
  const observedMs = Date.parse(source.observed_at);
  if (observedMs > Date.parse(source.captured_at)) {
    chronologyIssues.push(`${item.id} observed_at is after captured_at`);
  }
  if (source.evidence_role === "origin") return undefined;
  return observedMs;
}

function isInsideObservationWindow(ageHours: number, tier: SelectionTier): boolean {
  return ageHours >= 0 && ageHours <= SELECTION_RULES[tier].maximumAgeHours;
}

function observationWindowIssues(
  item: MemeItem,
  envelope: DailyEnvelope,
  tier: SelectionTier,
  observed: number[],
): string[] {
  if (observed.length === 0) return [`${item.id} has no observed_at evidence`];
  const ageHours = (memeSelectionClockMs(envelope) - Math.max(...observed)) / 3_600_000;
  if (isInsideObservationWindow(ageHours, tier)) return [];
  return [`${item.id} latest observed activity is outside ${tier}`];
}

function observationIssues(
  item: MemeItem,
  envelope: DailyEnvelope,
  tier: SelectionTier,
): string[] {
  const chronologyIssues: string[] = [];
  const observed = item.sources
    .map((source) => sourceObservationMs(item, source, chronologyIssues))
    .filter((value): value is number => value !== undefined);
  return [
    ...chronologyIssues,
    ...observationWindowIssues(item, envelope, tier, observed),
  ];
}

const scoredOutcomes = new Set<CandidateOutcome>([
  "selected",
  "dropped_low_confidence",
  "dropped_capacity",
]);

function candidateAudit(envelope: DailyEnvelope): CandidateAudit[] {
  return envelope.run_report.selection?.candidate_audit ?? [];
}

function auditScoreTotal(row: CandidateAudit): number | undefined {
  const parts = row.score_breakdown;
  if (!parts) return undefined;
  return parts.heat + parts.freshness + parts.reusability + parts.evidence;
}

function scorePartsMeetFloors(parts: NonNullable<CandidateAudit["score_breakdown"]>): boolean {
  return (
    parts.reusability >= MINIMUM_REUSABILITY_SCORE &&
    parts.evidence >= MINIMUM_EVIDENCE_SCORE
  );
}

function auditHasTierScore(row: CandidateAudit, tier: SelectionTier): boolean {
  const total = auditScoreTotal(row);
  if (total === undefined) return false;
  if (row.score !== total) return false;
  if (!scorePartsMeetFloors(row.score_breakdown!)) return false;
  return total >= SELECTION_RULES[tier].minimumScore;
}

function auditHasTierActivity(
  row: CandidateAudit,
  envelope: DailyEnvelope,
  tier: SelectionTier,
): boolean {
  if (!row.activity) return false;
  const ageHours =
    (memeSelectionClockMs(envelope) - Date.parse(row.activity.observed_at)) / 3_600_000;
  return isInsideObservationWindow(ageHours, tier);
}

function auditQualifiesForTier(
  row: CandidateAudit,
  envelope: DailyEnvelope,
  tier: SelectionTier,
): boolean {
  return auditHasTierScore(row, tier) && auditHasTierActivity(row, envelope, tier);
}

function missingAuditScoreIssues(row: CandidateAudit): string[] {
  if (!scoredOutcomes.has(row.outcome)) return [];
  if (row.score !== undefined) return [];
  return [`${row.candidate_key} audit is missing score`];
}

function missingAuditBreakdownIssues(row: CandidateAudit): string[] {
  if (!scoredOutcomes.has(row.outcome)) return [];
  if (row.score_breakdown) return [];
  return [`${row.candidate_key} audit is missing score_breakdown`];
}

function missingAuditActivityIssues(row: CandidateAudit): string[] {
  if (!scoredOutcomes.has(row.outcome)) return [];
  if (row.activity) return [];
  return [`${row.candidate_key} audit is missing activity`];
}

function auditScorePresenceIssues(row: CandidateAudit): string[] {
  return [
    ...missingAuditScoreIssues(row),
    ...missingAuditBreakdownIssues(row),
    ...missingAuditActivityIssues(row),
  ];
}

function auditScoreConsistencyIssues(row: CandidateAudit): string[] {
  const total = auditScoreTotal(row);
  if (total === undefined || row.score === undefined) return [];
  if (total === row.score) return [];
  return [`${row.candidate_key} audit score ${row.score} does not equal ${total}`];
}

function auditActivityChronologyIssues(
  row: CandidateAudit,
  envelope: DailyEnvelope,
): string[] {
  if (!row.activity) return [];
  if (Date.parse(row.activity.observed_at) <= memeSelectionClockMs(envelope)) return [];
  return [`${row.candidate_key} audit activity is after the selection clock`];
}

function auditCanonicalIssues(row: CandidateAudit): string[] {
  if (row.outcome === "dropped_safety") return [];
  const canonical = normalizeName(row.canonical_phrase ?? "");
  if (canonical) return [];
  return [`${row.candidate_key} audit is missing a stable canonical_phrase`];
}

function safetyPrivacyIssues(row: CandidateAudit): string[] {
  if (row.outcome !== "dropped_safety") return [];
  const privateDetails = [
    row.canonical_phrase,
    row.score,
    row.score_breakdown,
    row.activity,
    row.item_id,
  ].some((value) => value !== undefined);
  const issues: string[] = [];
  if (!OPAQUE_SAFETY_KEY.test(row.candidate_key)) {
    issues.push(`${row.candidate_key} safety audit key must be opaque`);
  }
  if (privateDetails) issues.push(`${row.candidate_key} safety audit must omit private details`);
  return issues;
}

function selectedItemIdIssues(row: CandidateAudit): string[] {
  if (row.outcome !== "selected") return [];
  if (row.item_id) return [];
  return [`${row.candidate_key} selected audit is missing item_id`];
}

function nonSelectedItemIdIssues(row: CandidateAudit): string[] {
  if (row.outcome === "selected") return [];
  if (!row.item_id) return [];
  return [`${row.candidate_key} non-selected audit cannot have item_id`];
}

function auditItemIdIssues(row: CandidateAudit): string[] {
  return [...selectedItemIdIssues(row), ...nonSelectedItemIdIssues(row)];
}

function safetyDropReasonIssues(row: CandidateAudit): string[] {
  if (row.outcome !== "dropped_safety") return [];
  if (row.drop_reason) return [];
  return [`${row.candidate_key} safety audit is missing drop_reason`];
}

function nonSafetyDropReasonIssues(row: CandidateAudit): string[] {
  if (row.outcome === "dropped_safety") return [];
  if (!row.drop_reason) return [];
  return [`${row.candidate_key} non-safety audit cannot have drop_reason`];
}

function auditDropReasonIssues(row: CandidateAudit): string[] {
  return [...safetyDropReasonIssues(row), ...nonSafetyDropReasonIssues(row)];
}

function candidateRowIssues(
  row: CandidateAudit,
  envelope: DailyEnvelope,
): string[] {
  return [
    ...auditScorePresenceIssues(row),
    ...auditScoreConsistencyIssues(row),
    ...auditActivityChronologyIssues(row, envelope),
    ...auditCanonicalIssues(row),
    ...safetyPrivacyIssues(row),
    ...auditItemIdIssues(row),
    ...auditDropReasonIssues(row),
  ];
}

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return Array.from(duplicates);
}

function auditIdentityIssues(envelope: DailyEnvelope, audit: CandidateAudit[]): string[] {
  const keyDuplicates = duplicateValues(audit.map((row) => row.candidate_key));
  const canonicals = audit
    .filter((row) => row.outcome !== "dropped_safety")
    .map((row) => normalizeName(row.canonical_phrase ?? ""))
    .filter(Boolean);
  const canonicalDuplicates = duplicateValues(canonicals);
  const issues: string[] = [];
  if (keyDuplicates.length > 0) issues.push(`${envelope.date} candidate_audit has duplicate keys`);
  if (canonicalDuplicates.length > 0) {
    issues.push(`${envelope.date} candidate_audit has duplicate canonical phrases`);
  }
  return issues;
}

function outcomeCount(audit: CandidateAudit[], outcome: CandidateOutcome): number {
  return audit.filter((row) => row.outcome === outcome).length;
}

function countMismatchIssue(
  date: string,
  label: string,
  actual: number,
  expected: number,
): string[] {
  if (actual === expected) return [];
  return [`${date} ${label} audit count ${actual} does not equal report ${expected}`];
}

function incrementCount(counts: Record<string, number>, key: string): void {
  const current = counts[key];
  counts[key] = current === undefined ? 1 : current + 1;
}

function safetyCounts(audit: CandidateAudit[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of audit) {
    if (row.outcome !== "dropped_safety") continue;
    if (!row.drop_reason) continue;
    incrementCount(counts, row.drop_reason);
  }
  return counts;
}

function normalizedCountRecord(record: Record<string, number>): string {
  return Object.entries(record)
    .filter(([, count]) => count > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, count]) => `${key}:${count}`)
    .join("|");
}

function safetyCountIssues(envelope: DailyEnvelope, audit: CandidateAudit[]): string[] {
  const actual = normalizedCountRecord(safetyCounts(audit));
  const expected = normalizedCountRecord(envelope.run_report.dropped_safety);
  if (actual === expected) return [];
  return [`${envelope.date} safety audit categories do not match dropped_safety`];
}

function capacityCountIssues(envelope: DailyEnvelope, audit: CandidateAudit[]): string[] {
  const expected = envelope.run_report.dropped_capacity;
  if (expected === undefined) return [`${envelope.date} is missing dropped_capacity`];
  return countMismatchIssue(
    envelope.date,
    "dropped_capacity",
    outcomeCount(audit, "dropped_capacity"),
    expected,
  );
}

function auditOutcomeCountIssues(
  envelope: DailyEnvelope,
  audit: CandidateAudit[],
): string[] {
  return [
    ...countMismatchIssue(
      envelope.date,
      "selected",
      outcomeCount(audit, "selected"),
      envelope.run_report.published,
    ),
    ...countMismatchIssue(
      envelope.date,
      "dropped_low_confidence",
      outcomeCount(audit, "dropped_low_confidence"),
      envelope.run_report.dropped_low_confidence,
    ),
    ...countMismatchIssue(
      envelope.date,
      "dropped_insufficient_evidence",
      outcomeCount(audit, "dropped_insufficient_evidence"),
      envelope.run_report.evidence_summary.dropped_insufficient_evidence,
    ),
    ...capacityCountIssues(envelope, audit),
    ...safetyCountIssues(envelope, audit),
  ];
}

function auditSizeIssues(envelope: DailyEnvelope, audit: CandidateAudit[]): string[] {
  if (audit.length === envelope.run_report.candidates_scanned) return [];
  return [
    `${envelope.date} candidate_audit length ${audit.length} does not equal candidates_scanned ${envelope.run_report.candidates_scanned}`,
  ];
}

function selectedAuditIdIssues(
  envelope: DailyEnvelope,
  audit: CandidateAudit[],
): string[] {
  const actual = audit
    .filter((row) => row.outcome === "selected")
    .flatMap((row) => row.item_id ? [row.item_id] : [])
    .sort();
  const expected = visibleItems(envelope).map((item) => item.id).sort();
  if (actual.join("|") === expected.join("|")) return [];
  return [`${envelope.date} selected candidate_audit ids do not match visible items`];
}

function sourceMatchesAuditActivity(
  source: MemeItem["sources"][number],
  activity: NonNullable<CandidateAudit["activity"]>,
): boolean {
  return (
    source.url === activity.url &&
    source.evidence_role === activity.evidence_role &&
    source.observed_at === activity.observed_at
  );
}

function selectedKeyIssues(row: CandidateAudit, item: MemeItem): string[] {
  if (row.candidate_key === item.id) return [];
  return [`${row.candidate_key} selected audit key must equal item id ${item.id}`];
}

function selectedCanonicalIssues(row: CandidateAudit, item: MemeItem): string[] {
  const auditCanonical = normalizeName(row.canonical_phrase ?? "");
  const itemCanonical = normalizeName(item.canonical_phrase ?? "");
  if (auditCanonical === itemCanonical) return [];
  return [`${row.candidate_key} audit canonical_phrase does not match selected item`];
}

function selectedScoreIssues(row: CandidateAudit, item: MemeItem): string[] {
  const issues: string[] = [];
  if (row.score !== item.score) issues.push(`${row.candidate_key} audit score differs from item`);
  if (JSON.stringify(row.score_breakdown) !== JSON.stringify(item.score_breakdown)) {
    issues.push(`${row.candidate_key} audit score_breakdown differs from item`);
  }
  return issues;
}

function selectedActivityIssues(row: CandidateAudit, item: MemeItem): string[] {
  if (!row.activity) return [];
  if (item.sources.some((source) => sourceMatchesAuditActivity(source, row.activity!))) {
    return [];
  }
  return [`${row.candidate_key} audit activity does not match an item source`];
}

function selectedRowIssues(
  row: CandidateAudit,
  envelope: DailyEnvelope,
): string[] {
  if (row.outcome !== "selected" || !row.item_id) return [];
  const item = visibleItems(envelope).find((candidate) => candidate.id === row.item_id);
  if (!item) return [];
  return [
    ...selectedKeyIssues(row, item),
    ...selectedCanonicalIssues(row, item),
    ...selectedScoreIssues(row, item),
    ...selectedActivityIssues(row, item),
  ];
}

function candidateAuditIssues(
  envelope: DailyEnvelope,
  tier: SelectionTier | undefined,
): string[] {
  if (!tier) return [];
  const audit = candidateAudit(envelope);
  return [
    ...auditSizeIssues(envelope, audit),
    ...auditIdentityIssues(envelope, audit),
    ...auditOutcomeCountIssues(envelope, audit),
    ...selectedAuditIdIssues(envelope, audit),
    ...audit.flatMap((row) => candidateRowIssues(row, envelope)),
    ...audit.flatMap((row) => selectedRowIssues(row, envelope)),
  ];
}

function derivedQualifiedCounts(
  envelope: DailyEnvelope,
  audit: CandidateAudit[],
): QualifiedCounts {
  const count = (tier: SelectionTier) =>
    audit.filter((row) => auditQualifiesForTier(row, envelope, tier)).length;
  return {
    strict_24h: count("strict_24h"),
    relaxed_48h: count("relaxed_48h"),
    relaxed_72h: count("relaxed_72h"),
  };
}

function qualificationCountIssues(
  envelope: DailyEnvelope,
  reported: QualifiedCounts,
  derived: QualifiedCounts,
): string[] {
  return (Object.keys(SELECTION_RULES) as SelectionTier[]).flatMap((tier) =>
    countMismatchIssue(
      envelope.date,
      `${tier} qualified`,
      derived[tier],
      reported[tier],
    ),
  );
}

function relaxed48TierIssues(
  envelope: DailyEnvelope,
  tier: SelectionTier,
  counts: QualifiedCounts,
): string[] {
  if (tier !== "relaxed_48h") return [];
  if (counts.strict_24h < MINIMUM_VISIBLE_ITEMS) return [];
  return [`${envelope.date} cannot use relaxed_48h while strict_24h has at least 3`];
}

function relaxed72TierIssues(
  envelope: DailyEnvelope,
  tier: SelectionTier,
  counts: QualifiedCounts,
): string[] {
  if (tier !== "relaxed_72h") return [];
  const strictEnough = counts.strict_24h >= MINIMUM_VISIBLE_ITEMS;
  const relaxedEnough = counts.relaxed_48h >= MINIMUM_VISIBLE_ITEMS;
  if (!strictEnough && !relaxedEnough) return [];
  return [`${envelope.date} cannot use relaxed_72h while a stricter tier has at least 3`];
}

function tierProgressionIssues(
  envelope: DailyEnvelope,
  tier: SelectionTier,
  counts: QualifiedCounts,
): string[] {
  return [
    ...relaxed48TierIssues(envelope, tier, counts),
    ...relaxed72TierIssues(envelope, tier, counts),
  ];
}

function capacitySelectionIssues(
  envelope: DailyEnvelope,
  tier: SelectionTier,
  counts: QualifiedCounts,
): string[] {
  const expectedSelected = Math.min(10, counts[tier]);
  const expectedCapacity = Math.max(0, counts[tier] - 10);
  const actualCapacity = envelope.run_report.dropped_capacity ?? -1;
  return [
    ...countMismatchIssue(
      envelope.date,
      "selected qualified",
      envelope.run_report.published,
      expectedSelected,
    ),
    ...countMismatchIssue(
      envelope.date,
      "capacity qualified",
      actualCapacity,
      expectedCapacity,
    ),
  ];
}

function selectedOutcomeIssues(
  envelope: DailyEnvelope,
  tier: SelectionTier,
  audit: CandidateAudit[],
): string[] {
  return audit.flatMap((row) => {
    const qualifies = auditQualifiesForTier(row, envelope, tier);
    const selectedOutcome =
      row.outcome === "selected" || row.outcome === "dropped_capacity";
    if (qualifies === selectedOutcome) return [];
    return [`${row.candidate_key} outcome does not match ${tier} qualification`];
  });
}

function topSelectionIssues(envelope: DailyEnvelope, audit: CandidateAudit[]): string[] {
  const selectedScores = audit
    .filter((row) => row.outcome === "selected")
    .flatMap((row) => row.score === undefined ? [] : [row.score]);
  const capacityScores = audit
    .filter((row) => row.outcome === "dropped_capacity")
    .flatMap((row) => row.score === undefined ? [] : [row.score]);
  if (capacityScores.length === 0) return [];
  if (Math.min(...selectedScores) >= Math.max(...capacityScores)) return [];
  return [`${envelope.date} selected items are not the top-scoring qualified candidates`];
}

function selectionAccountingIssues(
  envelope: DailyEnvelope,
  tier: SelectionTier | undefined,
): string[] {
  if (!tier) return [];
  const selection = envelope.run_report.selection;
  if (!selection) return [`${envelope.date} is missing selection accounting`];
  const audit = selection.candidate_audit;
  const derived = derivedQualifiedCounts(envelope, audit);
  return [
    ...qualificationCountIssues(envelope, selection.qualified, derived),
    ...tierProgressionIssues(envelope, tier, derived),
    ...capacitySelectionIssues(envelope, tier, derived),
    ...selectedOutcomeIssues(envelope, tier, audit),
    ...topSelectionIssues(envelope, audit),
    ...editorialCompletenessIssues(envelope, derived[tier]),
  ];
}

function occurrenceMatches(item: MemeItem, occurrence: Occurrence): boolean {
  if (item.id === occurrence.item.id) return true;
  const priorNames = new Set(itemNames(occurrence.item));
  return itemNames(item).some((name) => priorNames.has(name));
}

function newItemIssues(item: MemeItem, envelope: DailyEnvelope): string[] {
  const issues: string[] = [];
  if (!item.id.startsWith(`${envelope.date}-`)) {
    issues.push(`${item.id} is new to the board but does not use the envelope date`);
  }
  if (item.days_on_list !== 1) issues.push(`${item.id} new item requires days_on_list=1`);
  return issues;
}

function identityIssues(item: MemeItem, original: Occurrence): string[] {
  if (item.id === original.item.id) return [];
  return [`${item.id} must retain id ${original.item.id}`];
}

function canonicalAnchorNames(matches: Occurrence[]): string[] {
  const chronological = [...matches].sort((a, b) => a.date.localeCompare(b.date));
  const canonical = chronological.find((row) => row.item.canonical_phrase);
  if (canonical?.item.canonical_phrase) {
    return [normalizeName(canonical.item.canonical_phrase)];
  }
  return itemNames(chronological[0]!.item);
}

function canonicalIdentityIssues(item: MemeItem, matches: Occurrence[]): string[] {
  const current = normalizeName(item.canonical_phrase ?? "");
  if (!current) return [];
  if (canonicalAnchorNames(matches).includes(current)) return [];
  return [`${item.id} canonical_phrase does not match its first identity`];
}

function listCountIssues(item: MemeItem, matches: Occurrence[]): string[] {
  const expectedDays = new Set(matches.map((row) => row.date)).size + 1;
  if (item.days_on_list === expectedDays) return [];
  return [`${item.id} days_on_list must be ${expectedDays}`];
}

function recurrenceActivityIssues(item: MemeItem, matches: Occurrence[]): string[] {
  const lastSelectionMs = Math.max(...matches.map((row) => row.selectionMs));
  const hasNewActivity = item.sources.some(
    (source) =>
      source.evidence_role !== "origin" &&
      source.observed_at &&
      Date.parse(source.observed_at) > lastSelectionMs,
  );
  if (hasNewActivity) return [];
  return [`${item.id} recurrence lacks post-publication activity`];
}

function recurrenceIssues(
  item: MemeItem,
  envelope: DailyEnvelope,
  history: Occurrence[],
): string[] {
  const matches = history.filter((occurrence) => occurrenceMatches(item, occurrence));
  if (matches.length === 0) return newItemIssues(item, envelope);
  const original = [...matches].sort((a, b) => a.date.localeCompare(b.date))[0]!;
  return [
    ...identityIssues(item, original),
    ...canonicalIdentityIssues(item, matches),
    ...listCountIssues(item, matches),
    ...recurrenceActivityIssues(item, matches),
  ];
}

function heldIdentityIssues(item: MemeItem, heldHistory: Occurrence[]): string[] {
  const matchesHeld = heldHistory.some((occurrence) =>
    occurrenceMatches(item, occurrence),
  );
  if (!matchesHeld) return [];
  return [`${item.id} matches an operator-held identity`];
}

function dynamicItemIssues(
  item: MemeItem,
  envelope: DailyEnvelope,
  tier: SelectionTier | undefined,
  history: Occurrence[],
  heldHistory: Occurrence[],
): string[] {
  if (envelope.date < DYNAMIC_SELECTION_DATE || !tier) return [];
  return [
    ...scoreIssues(item, tier),
    ...observationIssues(item, envelope, tier),
    ...recurrenceIssues(item, envelope, history),
    ...heldIdentityIssues(item, heldHistory),
  ];
}

function occurrenceFor(envelope: DailyEnvelope, item: MemeItem): Occurrence {
  return {
    date: envelope.date,
    item,
    selectionMs: memeSelectionClockMs(envelope),
  };
}

function appendHeldHistory(
  envelope: DailyEnvelope,
  heldHistory: Occurrence[],
): void {
  if (envelope.status !== "held") return;
  heldHistory.push(...envelope.items.map((item) => occurrenceFor(envelope, item)));
}

/**
 * Dynamic selection has no fixed cross-day quota. New and recurring language
 * units compete on the same score and evidence window. A recurrence remains
 * eligible only when a source proves activity after its prior publication.
 */
export function dynamicSelectionIssues(envelopes: DailyEnvelope[]): string[] {
  const issues: string[] = [];
  const history: Occurrence[] = [];
  const heldHistory: Occurrence[] = [];
  const byDateAsc = [...envelopes].sort((a, b) => a.date.localeCompare(b.date));
  for (const envelope of byDateAsc) {
    issues.push(...memeSelectionClockIssues(envelope));
    issues.push(...dynamicEnvelopeIssues(envelope));
    const tier = selectionTier(envelope);
    for (const item of visibleItems(envelope)) {
      issues.push(...dynamicItemIssues(item, envelope, tier, history, heldHistory));
      history.push(occurrenceFor(envelope, item));
    }
    appendHeldHistory(envelope, heldHistory);
  }
  return issues;
}
