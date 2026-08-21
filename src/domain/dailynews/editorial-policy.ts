/**
 * input: parsed DailyNews v3 envelopes, evidence, candidate audits, and selection clocks
 * output: deterministic evidence, composition, chronology, and editorial-completeness issues
 * pos: v3 DailyNews policy module, called by rules.ts and kept independent from UI/data loading
 */
import {
  NEWS_EDITORIAL_POLICY_VERSION,
  newsSelectionClockIssues,
  newsSelectionClockMs,
  type NewsEnvelope,
  type NewsItem,
} from "./schema";

const MAXIMUM_VISIBLE_ITEMS = 10;
const MINIMUM_VISIBLE_ITEMS = 3;
const MINIMUM_CANDIDATE_POOL = 30;
const EXACT_THREE_CANDIDATE_POOL = 45;
const MINIMUM_INTERNATIONAL_RELEVANCE = 15;
const MINIMUM_GLOBAL_RELEVANCE = 20;
const MINIMUM_GLOBAL_HEAT = 30;
const MINIMUM_GLOBAL_EVIDENCE = 12;
const MINIMUM_EVERYDAY_RELEVANCE = 15;
const STRICT_SCORE = 75;
const RELAXED_48H_SCORE = 70;
const RELAXED_72H_SCORE = 65;

type Selection = NonNullable<NewsEnvelope["run_report"]["selection"]>;
type CandidateAudit = Selection["candidate_audit"][number];
type SelectionTier = Selection["tier"];
type AudienceRelevance = NonNullable<NewsItem["audience_relevance"]>;

const TIER_ORDER: Record<SelectionTier, number> = {
  strict_24h: 0,
  relaxed_48h: 1,
  relaxed_72h: 2,
};
const DEFAULT_PORTS: Record<string, string> = { "http:": "80", "https:": "443" };
const TRACKING_QUERY_KEY = /^(?:utm_.+|fbclid|gclid|dclid|msclkid|spm|from|ref|referrer|source)$/i;
const HEADLINE_EMOJI_RE = /^\p{Extended_Pictographic}/u;
const OPAQUE_SAFETY_KEY = /^candidate-\d+$/;
export const NEWS_SAFETY_DROP_REASONS = [
  "politics", "geopolitics", "propaganda", "public_safety", "privacy", "minors",
  "harassment", "illegal", "rumor", "celebrity_dispute", "controversy",
] as const;
const NEWS_SAFETY_DROP_REASON_SET = new Set<string>(NEWS_SAFETY_DROP_REASONS);

function usesV3Policy(envelope: NewsEnvelope): boolean {
  return envelope.policy_version === NEWS_EDITORIAL_POLICY_VERSION;
}
function normalizedOutlet(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}
function normalizedPath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
}
function canonicalPort(url: URL): string {
  if (!url.port) return "";
  if (DEFAULT_PORTS[url.protocol] === url.port) return "";
  return `:${url.port}`;
}
export function canonicalNewsEvidenceUrl(value: string): string {
  const url = new URL(value);
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_QUERY_KEY.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const query = url.searchParams.toString();
  const suffix = query ? `?${query}` : "";
  return `${host}${canonicalPort(url)}${normalizedPath(url.pathname)}${suffix}`;
}
function hasInternationalHeatEvidence(item: NewsItem): boolean {
  const uniqueUrls = new Set(item.sources.map((source) => canonicalNewsEvidenceUrl(source.url)));
  const independentOutlets = new Set(item.sources.map((source) => normalizedOutlet(source.outlet)));
  const hasEditorialSource = item.sources.some(
    (source) => source.tier === "state_media" || source.tier === "major_media",
  );
  return uniqueUrls.size >= 2 && independentOutlets.size >= 2 && hasEditorialSource;
}
export function usesInternationalEvidence(item: NewsItem, policyVersion?: string): boolean {
  if (policyVersion !== NEWS_EDITORIAL_POLICY_VERSION) return false;
  return item.scope === "international";
}
function hasLegacyEvidence(item: NewsItem): boolean {
  const uniqueUrls = new Set(item.sources.map((source) => canonicalNewsEvidenceUrl(source.url)));
  const authoritative = item.sources.some((source) =>
    ["official", "state_media"].includes(source.tier)
  );
  if (authoritative) return true;
  if (uniqueUrls.size < 2) return false;
  return item.sources.some((source) => source.tier === "major_media");
}
export function hasNewsEvidence(item: NewsItem, policyVersion?: string): boolean {
  if (usesInternationalEvidence(item, policyVersion)) return hasInternationalHeatEvidence(item);
  return hasLegacyEvidence(item);
}
export function visibleNewsItems(envelope: NewsEnvelope): NewsItem[] {
  if (envelope.status === "held" || envelope.status === "skipped") return [];
  return envelope.items.filter(
    (item) => item.published && hasNewsEvidence(item, envelope.policy_version),
  );
}
function visibleNews(envelope: NewsEnvelope): NewsItem[] {
  return visibleNewsItems(envelope);
}

function scoreTotal(item: Pick<NewsItem, "score_breakdown">): number | undefined {
  const score = item.score_breakdown;
  if (!score) return undefined;
  return score.heat + score.freshness + score.everyday_relevance + score.evidence;
}
function v3ItemMetadataIssues(envelope: NewsEnvelope): string[] {
  return envelope.items.flatMap(itemMetadataIssues);
}
export function headlineEmojiIssues(envelope: NewsEnvelope): string[] {
  if (!usesV3Policy(envelope)) return [];
  return envelope.items.flatMap((item) =>
    HEADLINE_EMOJI_RE.test(item.headline)
      ? []
      : [`${item.id} v3 headline must begin with a semantic emoji`]
  );
}
function missingValueIssue(value: unknown, message: string): string[] {
  return value === undefined ? [message] : [];
}
function itemScoreIssues(item: NewsItem): string[] {
  const total = scoreTotal(item);
  if (total === undefined) return [];
  if (item.score === total) return [];
  return [`${item.id} score ${String(item.score)} does not equal breakdown ${total}`];
}
function itemEverydayRelevanceIssues(item: NewsItem): string[] {
  const relevance = item.score_breakdown?.everyday_relevance;
  if (relevance === undefined) return [];
  return relevance < MINIMUM_EVERYDAY_RELEVANCE
    ? [`${item.id} everyday_relevance ${relevance} is below ${MINIMUM_EVERYDAY_RELEVANCE}`]
    : [];
}
function internationalItemMetadataIssues(item: NewsItem): string[] {
  if (item.scope !== "international") return [];
  return internationalMetadataIssues(item);
}
function itemMetadataIssues(item: NewsItem): string[] {
  return [
    ...missingValueIssue(item.story_identity, `${item.id} v3 item is missing story_identity`),
    ...missingValueIssue(item.scope, `${item.id} v3 item is missing scope`),
    ...missingValueIssue(item.topic, `${item.id} v3 item is missing topic`),
    ...missingValueIssue(item.score, `${item.id} v3 item is missing score`),
    ...missingValueIssue(item.score_breakdown, `${item.id} v3 item is missing score_breakdown`),
    ...missingValueIssue(item.occurred_at, `${item.id} v3 item is missing occurred_at`),
    ...itemScoreIssues(item),
    ...itemEverydayRelevanceIssues(item),
    ...internationalItemMetadataIssues(item),
  ];
}
function internationalMetadataIssues(item: NewsItem): string[] {
  const relevance = item.audience_relevance;
  const organization = missingValueIssue(
    item.primary_organization,
    `${item.id} international item is missing primary_organization`,
  );
  if (!relevance) return [...organization, `${item.id} international item is missing audience_relevance`];
  return [
    ...organization,
    ...audienceScoreIssues(item, relevance),
    ...impactScaleIssues(item, relevance),
    ...directConnectionIssues(item, relevance),
    ...globalMajorIssues(item, relevance),
  ];
}
function audienceScoreIssues(item: NewsItem, relevance: AudienceRelevance): string[] {
  const minimum = relevance.basis === "global_major_event"
    ? MINIMUM_GLOBAL_RELEVANCE
    : MINIMUM_INTERNATIONAL_RELEVANCE;
  return relevance.score < minimum
    ? [`${item.id} international audience relevance ${relevance.score} is below ${minimum}`]
    : [];
}
function impactScaleIssues(item: NewsItem, relevance: AudienceRelevance): string[] {
  if (relevance.impact_scale === "routine_local") {
    return [`${item.id} routine_local international story is not publishable`];
  }
  const expected = relevance.basis === "direct_china_impact"
    ? "direct_china_public"
    : "global_systemic";
  return relevance.impact_scale === expected
    ? []
    : [`${item.id} audience basis ${relevance.basis} requires impact_scale ${expected}`];
}
function directConnectionIssues(item: NewsItem, relevance: AudienceRelevance): string[] {
  if (relevance.basis !== "direct_china_impact") return [];
  const evidence = relevance.connection_evidence;
  if (!evidence) return [`${item.id} direct China impact is missing connection_evidence`];
  const sources = new Set(item.sources.map((source) => canonicalNewsEvidenceUrl(source.url)));
  return sources.has(canonicalNewsEvidenceUrl(evidence.url))
    ? []
    : [`${item.id} connection_evidence URL must match one of the item sources`];
}
function globalMajorIssues(item: NewsItem, relevance: AudienceRelevance): string[] {
  if (relevance.basis !== "global_major_event") return [];
  const breakdown = item.score_breakdown;
  if (!breakdown) return [];
  return [
    ...mismatchIssue(breakdown.heat < MINIMUM_GLOBAL_HEAT, `${item.id} global event heat is below ${MINIMUM_GLOBAL_HEAT}`),
    ...mismatchIssue(breakdown.evidence < MINIMUM_GLOBAL_EVIDENCE, `${item.id} global event evidence is below ${MINIMUM_GLOBAL_EVIDENCE}`),
  ];
}

export function domesticMajorityIssues(envelope: NewsEnvelope): string[] {
  if (!usesV3Policy(envelope)) return [];
  return domesticMixIssues(visibleNews(envelope));
}
function domesticMixIssues(visible: NewsItem[]): string[] {
  if (visible.length === 0) return [];
  const domestic = visible.filter((item) => item.scope === "domestic").length;
  const international = visible.filter((item) => item.scope === "international").length;
  const requiredDomestic = Math.ceil(visible.length * 0.75);
  const maximumInternational = Math.floor(visible.length * 0.25);
  if (domestic < requiredDomestic) return domesticMixIssue(visible.length, domestic, international);
  if (international > maximumInternational) return domesticMixIssue(visible.length, domestic, international);
  return [];
}
function domesticMixIssue(total: number, domestic: number, international: number): string[] {
  const requiredDomestic = Math.ceil(total * 0.75);
  const maximumInternational = Math.floor(total * 0.25);
  return [
    `v3 mix requires domestic>=${requiredDomestic} and international<=${maximumInternational}; got domestic=${domestic}, international=${international}, visible=${total}`,
  ];
}
function canonicalOrganization(value: string): string {
  const normalized = normalizedOutlet(value);
  const alias = ORGANIZATION_ALIASES.find(({ pattern }) => pattern.test(normalized));
  return alias?.key ?? normalized;
}
const ORGANIZATION_ALIASES: { key: string; pattern: RegExp }[] = [
  { key: "nasa", pattern: /nasa|美国国家航空航天局/u },
  { key: "who", pattern: /who|世界卫生组织/u },
  { key: "unesco", pattern: /unesco|联合国教科文/u },
  { key: "unicef", pattern: /unicef|联合国儿童基金会/u },
  { key: "esa", pattern: /(^|[^a-z])esa([^a-z]|$)|欧洲航天局/u },
];

export function internationalConcentrationIssues(envelope: NewsEnvelope): string[] {
  if (!usesV3Policy(envelope)) return [];
  const international = visibleNews(envelope).filter((item) => item.scope === "international");
  return [...organizationConcentrationIssues(international), ...spaceConcentrationIssues(international)];
}
function organizationCounts(items: NewsItem[]): Map<string, number> {
  const organizations = new Map<string, number>();
  for (const item of items) {
    if (!item.primary_organization) continue;
    const key = canonicalOrganization(item.primary_organization);
    organizations.set(key, (organizations.get(key) ?? 0) + 1);
  }
  return organizations;
}
function organizationConcentrationIssues(items: NewsItem[]): string[] {
  return [...organizationCounts(items).entries()]
    .filter(([, count]) => count > 1)
    .map(([organization, count]) => `international organization ${organization} appears ${count} times; maximum is 1`);
}
function isSpaceStory(item: NewsItem): boolean {
  if (item.topic === "太空航天") return true;
  return canonicalOrganization(item.primary_organization ?? "") === "nasa";
}
function spaceConcentrationIssues(items: NewsItem[]): string[] {
  const count = items.filter(isSpaceStory).length;
  return count > 1
    ? [`international space/NASA stories appear ${count} times; maximum is 1`]
    : [];
}
function candidateScoreTotal(row: CandidateAudit): number | undefined {
  const score = row.score_breakdown;
  if (!score) return undefined;
  return score.heat + score.freshness + score.everyday_relevance + score.evidence;
}

const SCORE_TIERS: { minimum: number; tier: SelectionTier }[] = [
  { minimum: STRICT_SCORE, tier: "strict_24h" },
  { minimum: RELAXED_48H_SCORE, tier: "relaxed_48h" },
  { minimum: RELAXED_72H_SCORE, tier: "relaxed_72h" },
];
const TIME_TIERS: { maximumHours: number; tier: SelectionTier }[] = [
  { maximumHours: 24, tier: "strict_24h" },
  { maximumHours: 48, tier: "relaxed_48h" },
  { maximumHours: 72, tier: "relaxed_72h" },
];

function qualificationTierForScore(score: number | undefined): SelectionTier | undefined {
  const numericScore = score ?? -1;
  return SCORE_TIERS.find(({ minimum }) => numericScore >= minimum)?.tier;
}
function qualificationTierForAge(ageHours: number): SelectionTier | undefined {
  if (ageHours < 0) return undefined;
  return TIME_TIERS.find(({ maximumHours }) => ageHours <= maximumHours)?.tier;
}
function laterTier(
  scoreTier: SelectionTier | undefined,
  timeTier: SelectionTier | undefined,
): SelectionTier | undefined {
  if (!scoreTier) return undefined;
  if (!timeTier) return undefined;
  return TIER_ORDER[scoreTier] >= TIER_ORDER[timeTier] ? scoreTier : timeTier;
}
function candidateQualificationTier(row: CandidateAudit, clockMs: number): SelectionTier | undefined {
  if (!row.score_breakdown) return undefined;
  if (row.score_breakdown.everyday_relevance < MINIMUM_EVERYDAY_RELEVANCE) return undefined;
  if (!row.occurred_at) return undefined;
  const ageHours = (clockMs - Date.parse(row.occurred_at)) / 3_600_000;
  return laterTier(qualificationTierForScore(row.score), qualificationTierForAge(ageHours));
}
function qualifiesAt(row: CandidateAudit, tier: SelectionTier): boolean {
  return row.qualification_tier !== undefined && TIER_ORDER[row.qualification_tier] <= TIER_ORDER[tier];
}
function rankedCandidates(rows: CandidateAudit[]): CandidateAudit[] {
  return [...rows].sort((left, right) =>
    (right.score ?? -1) - (left.score ?? -1) || left.candidate_key.localeCompare(right.candidate_key)
  );
}
function bestScopedRows(rows: CandidateAudit[], count: number): CandidateAudit[] {
  return rankedCandidates(rows).slice(0, count);
}
function scoreSum(rows: CandidateAudit[]): number {
  return rows.reduce((sum, row) => sum + (row.score ?? -1), 0);
}
function scopedSelectionOption(
  domestic: CandidateAudit[],
  international: CandidateAudit[],
  count: number,
  internationalCount: number,
): CandidateAudit[] | undefined {
  const domesticCount = count - internationalCount;
  if (domesticCount > domestic.length) return undefined;
  return [
    ...bestScopedRows(domestic, domesticCount),
    ...bestScopedRows(international, internationalCount),
  ];
}
function isBetterSelection(current: CandidateAudit[], candidate: CandidateAudit[]): boolean {
  if (current.length === 0) return true;
  return scoreSum(candidate) > scoreSum(current);
}
function selectionForCount(rows: CandidateAudit[], count: number): CandidateAudit[] {
  const domestic = rows.filter((row) => row.scope === "domestic");
  const international = rows.filter((row) => row.scope === "international");
  let best: CandidateAudit[] = [];
  for (let intlCount = 0; intlCount <= Math.min(international.length, Math.floor(count / 4)); intlCount += 1) {
    const candidate = scopedSelectionOption(domestic, international, count, intlCount);
    if (!candidate) continue;
    if (isBetterSelection(best, candidate)) best = candidate;
  }
  return rankedCandidates(best);
}
function expectedSelection(rows: CandidateAudit[], tier: SelectionTier): CandidateAudit[] {
  const qualified = rows.filter((row) => qualifiesAt(row, tier));
  for (let count = Math.min(MAXIMUM_VISIBLE_ITEMS, qualified.length); count >= 1; count -= 1) {
    const selected = selectionForCount(qualified, count);
    if (selected.length === count) return selected;
  }
  return [];
}
function expectedTier(rows: CandidateAudit[]): SelectionTier {
  const tiers: SelectionTier[] = ["strict_24h", "relaxed_48h", "relaxed_72h"];
  return tiers.find((tier) => expectedSelection(rows, tier).length >= MINIMUM_VISIBLE_ITEMS) ?? "relaxed_72h";
}
function isEvidenceDrop(row: CandidateAudit): boolean {
  return ["dropped_safety", "dropped_insufficient_evidence"].includes(row.outcome);
}
function hasScoreMetadata(row: CandidateAudit): boolean {
  const present = [row.score !== undefined, Boolean(row.score_breakdown), Boolean(row.qualification_tier)];
  return present.includes(true);
}
function auditScorePresenceIssues(row: CandidateAudit): string[] {
  if (isEvidenceDrop(row)) {
    return hasScoreMetadata(row)
      ? [`${row.candidate_key} safety/evidence drop must omit score and qualification_tier`]
      : [];
  }
  return [
    ...missingValueIssue(row.score, `${row.candidate_key} audit is missing score`),
    ...missingValueIssue(row.score_breakdown, `${row.candidate_key} audit is missing score_breakdown`),
  ];
}
function auditScoreConsistencyIssues(row: CandidateAudit): string[] {
  const total = candidateScoreTotal(row);
  if (total === undefined) return [];
  return row.score === total ? [] : [`${row.candidate_key} score does not equal score_breakdown`];
}
function auditTierIssues(row: CandidateAudit, clockMs: number): string[] {
  const expected = isEvidenceDrop(row) ? undefined : candidateQualificationTier(row, clockMs);
  if (row.qualification_tier === expected) return [];
  return [
    `${row.candidate_key} qualification_tier ${String(row.qualification_tier)} does not match score/time-derived ${String(expected)}`,
  ];
}
function auditOccurredAtIssues(row: CandidateAudit, clockMs: number): string[] {
  if (row.outcome === "dropped_safety") return [];
  if (!row.occurred_at) return [`${row.candidate_key} audit is missing occurred_at`];
  return Date.parse(row.occurred_at) > clockMs
    ? [`${row.candidate_key} occurred_at is after the selection clock`]
    : [];
}
function auditItemLinkIssues(row: CandidateAudit): string[] {
  if (row.outcome === "selected") {
    return row.item_id ? [] : [`${row.candidate_key} selected audit is missing item_id`];
  }
  return row.item_id ? [`${row.candidate_key} non-selected audit cannot have item_id`] : [];
}
function auditDropReasonIssues(row: CandidateAudit): string[] {
  if (row.outcome === "selected") {
    return row.drop_reason ? [`${row.candidate_key} selected audit cannot have drop_reason`] : [];
  }
  return row.drop_reason ? [] : [`${row.candidate_key} dropped audit is missing drop_reason`];
}
function auditStoryIdentityIssues(row: CandidateAudit): string[] {
  if (row.outcome === "dropped_safety") {
    return row.story_identity ? [`${row.candidate_key} safety drop must omit story_identity`] : [];
  }
  return missingValueIssue(row.story_identity, `${row.candidate_key} audit is missing story_identity`);
}
function auditScopeTopicIssues(row: CandidateAudit): string[] {
  if (row.outcome === "dropped_safety") return [];
  return [
    ...missingValueIssue(row.scope, `${row.candidate_key} audit is missing scope`),
    ...missingValueIssue(row.topic, `${row.candidate_key} audit is missing topic`),
  ];
}
function auditRowIssues(row: CandidateAudit, clockMs: number): string[] {
  return [
    ...auditScorePresenceIssues(row),
    ...auditScoreConsistencyIssues(row),
    ...auditTierIssues(row, clockMs),
    ...auditOccurredAtIssues(row, clockMs),
    ...auditItemLinkIssues(row),
    ...auditDropReasonIssues(row),
    ...auditStoryIdentityIssues(row),
    ...auditScopeTopicIssues(row),
  ];
}
function hasSafetyPrivateDetails(row: CandidateAudit): boolean {
  return [
    row.story_identity, row.occurred_at, row.scope, row.topic, row.item_id,
    row.score, row.score_breakdown, row.qualification_tier,
  ].some((value) => value !== undefined);
}
function safetyLedgerRowIssues(row: CandidateAudit): string[] {
  if (row.outcome !== "dropped_safety") return [];
  const reasonAllowed = row.drop_reason && NEWS_SAFETY_DROP_REASON_SET.has(row.drop_reason);
  return [
    ...mismatchIssue(!OPAQUE_SAFETY_KEY.test(row.candidate_key), `${row.candidate_key} safety audit key must be opaque`),
    ...mismatchIssue(hasSafetyPrivateDetails(row), `${row.candidate_key} safety audit must omit private details`),
    ...mismatchIssue(!row.drop_reason, `${row.candidate_key} safety audit is missing drop_reason`),
    ...mismatchIssue(Boolean(row.drop_reason) && !reasonAllowed, `${row.candidate_key} safety drop_reason is not an allowed category`),
  ];
}
function incrementSafetyCount(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}
function safetyAuditCounts(rows: CandidateAudit[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (row.outcome !== "dropped_safety" || !row.drop_reason) continue;
    incrementSafetyCount(counts, row.drop_reason);
  }
  return counts;
}
function normalizedCounts(counts: Record<string, number>): string {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, count]) => `${key}:${count}`)
    .join("|");
}
function safetyReportCategoryIssues(envelope: NewsEnvelope): string[] {
  return Object.keys(envelope.run_report.dropped_safety).flatMap((reason) =>
    NEWS_SAFETY_DROP_REASON_SET.has(reason)
      ? []
      : [`run_report.dropped_safety category ${reason} is not allowed`]
  );
}
export function safetyAuditLedgerIssues(
  envelope: NewsEnvelope,
  rows: CandidateAudit[],
): string[] {
  if (!usesV3Policy(envelope)) return [];
  const actual = normalizedCounts(safetyAuditCounts(rows));
  const reported = normalizedCounts(envelope.run_report.dropped_safety);
  return [
    ...rows.flatMap(safetyLedgerRowIssues),
    ...safetyReportCategoryIssues(envelope),
    ...mismatchIssue(actual !== reported, "safety audit categories do not match run_report.dropped_safety"),
  ];
}
function qualifiedCounts(rows: CandidateAudit[]): Selection["qualified"] {
  return {
    strict_24h: rows.filter((row) => qualifiesAt(row, "strict_24h")).length,
    relaxed_48h: rows.filter((row) => qualifiesAt(row, "relaxed_48h")).length,
    relaxed_72h: rows.filter((row) => qualifiesAt(row, "relaxed_72h")).length,
  };
}
function qualifiedCountIssues(selection: Selection): string[] {
  const expected = qualifiedCounts(selection.candidate_audit);
  const fields: (keyof Selection["qualified"])[] = ["strict_24h", "relaxed_48h", "relaxed_72h"];
  return fields.flatMap((field) =>
    selection.qualified[field] === expected[field]
      ? []
      : [`selection.qualified.${field}=${selection.qualified[field]} does not match audit=${expected[field]}`]
  );
}
function candidateOutcomeIssues(selection: Selection): string[] {
  const selectableOutcomes: CandidateAudit["outcome"][] = [
    "selected", "dropped_quota", "dropped_capacity",
  ];
  return selection.candidate_audit.flatMap((row) => {
    if (row.outcome === "dropped_safety" || row.outcome === "dropped_insufficient_evidence") return [];
    const qualified = qualifiesAt(row, selection.tier);
    const selectable = selectableOutcomes.includes(row.outcome);
    if (qualified === selectable) return [];
    return [`${row.candidate_key} outcome ${row.outcome} does not match ${selection.tier} score qualification`];
  });
}
function selectionStatusIssues(envelope: NewsEnvelope, selection: Selection): string[] {
  const expectedStatus = selection.tier === "strict_24h" ? "published" : "partial";
  if (envelope.status === expectedStatus) return [];
  return [`selection tier ${selection.tier} requires status ${expectedStatus}; got ${envelope.status}`];
}

type ResearchPassSummary = { issues: string[]; total: number };

function researchPassSummary(selection: Selection): ResearchPassSummary {
  const issues: string[] = [];
  let cumulative = 0;
  for (const [index, pass] of selection.research_passes.entries()) {
    if (pass.pass !== index + 1) issues.push(`research_passes must be sequential from pass 1`);
    cumulative += pass.candidates_added;
    if (pass.cumulative_unique_candidates !== cumulative) {
      issues.push(`research pass ${pass.pass} cumulative count does not match candidates_added`);
    }
  }
  return { issues, total: cumulative };
}
function researchTotalIssues(envelope: NewsEnvelope, total: number): string[] {
  if (total === envelope.run_report.candidates_scanned) return [];
  return [
    `research passes total ${total} does not match candidates_scanned ${envelope.run_report.candidates_scanned}`,
  ];
}
function researchPassIssues(envelope: NewsEnvelope, selection: Selection): string[] {
  const summary = researchPassSummary(selection);
  const exactThree = visibleNews(envelope).length === 3
    ? exactThreeResearchIssues(envelope, selection)
    : [];
  return [
    ...summary.issues,
    ...researchTotalIssues(envelope, summary.total),
    ...researchPassRowIssues(selection),
    ...secondPassScopeIssues(selection),
    ...exactThree,
  ];
}
function normalizedSourceScope(value: string): string {
  return value.trim().toLowerCase();
}
type ResearchPass = Selection["research_passes"][number];
function sourceScopes(pass: ResearchPass | undefined): string[] {
  if (!pass) return [];
  return pass.source_scope.map(normalizedSourceScope);
}
function includesNewScope(first: string[], second: string[]): boolean {
  const known = new Set(first);
  return second.some((scope) => !known.has(scope));
}
function secondPassScopeIssues(selection: Selection): string[] {
  if (selection.research_passes.length !== 2) return [];
  const first = sourceScopes(selection.research_passes[0]);
  const second = sourceScopes(selection.research_passes[1]);
  return includesNewScope(first, second)
    ? []
    : ["second research pass must add at least one new source_scope"];
}
function researchPassRowIssues(selection: Selection): string[] {
  const declared = new Set(selection.research_passes.map((pass) => pass.pass));
  const issues = selection.candidate_audit.flatMap((row) =>
    declared.has(row.research_pass)
      ? []
      : [`${row.candidate_key} references undeclared research pass ${row.research_pass}`]
  );
  for (const pass of selection.research_passes) {
    const rows = selection.candidate_audit.filter((row) => row.research_pass === pass.pass).length;
    if (pass.candidates_added !== rows) {
      issues.push(`research pass ${pass.pass} candidates_added=${pass.candidates_added} does not match audit rows=${rows}`);
    }
  }
  return issues;
}
function exactThreeResearchIssues(envelope: NewsEnvelope, selection: Selection): string[] {
  return [
    ...exactThreePoolIssues(envelope),
    ...secondPassPresenceIssues(selection),
    ...firstPassSizeIssues(selection),
    ...secondPassSizeIssues(selection),
  ];
}
function exactThreePoolIssues(envelope: NewsEnvelope): string[] {
  return envelope.run_report.candidates_scanned < EXACT_THREE_CANDIDATE_POOL
    ? [`exactly 3 visible items require >=${EXACT_THREE_CANDIDATE_POOL} unique candidates`]
    : [];
}
function secondPassPresenceIssues(selection: Selection): string[] {
  return selection.research_passes.length === 2
    ? []
    : ["exactly 3 visible items require a second research pass"];
}
function firstPassSizeIssues(selection: Selection): string[] {
  const firstPass = selection.research_passes[0];
  if (!firstPass || firstPass.pass !== 1) return [];
  return firstPass.candidates_added >= MINIMUM_CANDIDATE_POOL
    ? []
    : [`first research pass must add at least ${MINIMUM_CANDIDATE_POOL} unique candidates`];
}
function secondPassSizeIssues(selection: Selection): string[] {
  if (selection.research_passes.length !== 2) return [];
  const secondPass = selection.research_passes[1];
  if (!secondPass) return [];
  if (secondPass.candidates_added >= 15) return [];
  return ["second research pass must add at least 15 unique candidates"];
}
function duplicateValueIssues(values: string[], label: string): string[] {
  return values.length === new Set(values).size ? [] : [`candidate_audit has duplicate ${label} values`];
}
function selectedIdIssues(envelope: NewsEnvelope, selectedRows: CandidateAudit[]): string[] {
  const selectedIds = selectedRows.map((row) => row.item_id).filter((id): id is string => Boolean(id));
  const visibleIds = visibleNews(envelope).map((item) => item.id);
  const matches = [...selectedIds].sort().join("|") === [...visibleIds].sort().join("|");
  return matches ? [] : ["selected candidate_audit ids do not match visible items"];
}
function selectedKeyIssues(selectedRows: CandidateAudit[]): string[] {
  const mismatched = selectedRows.some((row) => row.candidate_key !== row.item_id);
  return mismatched ? ["selected candidate_key must equal item_id"] : [];
}
function auditIdentityIssues(envelope: NewsEnvelope, selection: Selection): string[] {
  const rows = selection.candidate_audit;
  const keys = rows.map((row) => row.candidate_key);
  const identities = rows.map((row) => row.story_identity).filter((value): value is string => Boolean(value));
  const selectedRows = rows.filter((row) => row.outcome === "selected");
  return [
    ...duplicateValueIssues(keys, "candidate_key"),
    ...duplicateValueIssues(identities, "story_identity"),
    ...selectedIdIssues(envelope, selectedRows),
    ...selectedKeyIssues(selectedRows),
  ];
}
function selectedItemAuditIssues(envelope: NewsEnvelope, selection: Selection): string[] {
  const rows = new Map(selection.candidate_audit.map((row) => [row.item_id, row]));
  return visibleNews(envelope).flatMap((item) => selectedItemIssues(item, rows.get(item.id)));
}
function mismatchIssue(mismatch: boolean, message: string): string[] {
  return mismatch ? [message] : [];
}
function selectedItemIssues(item: NewsItem, row: CandidateAudit | undefined): string[] {
  if (!row) return [`${item.id} is missing its selected candidate audit`];
  const scopeMismatch = row.scope !== item.scope || row.topic !== item.topic;
  const breakdownMismatch = JSON.stringify(row.score_breakdown) !== JSON.stringify(item.score_breakdown);
  return [
    ...mismatchIssue(row.story_identity !== item.story_identity, `${item.id} audit story_identity differs from item`),
    ...mismatchIssue(scopeMismatch, `${item.id} audit scope/topic differs from item`),
    ...mismatchIssue(row.score !== item.score, `${item.id} audit score differs from item`),
    ...mismatchIssue(breakdownMismatch, `${item.id} audit score_breakdown differs from item`),
    ...mismatchIssue(row.occurred_at !== item.occurred_at, `${item.id} audit occurred_at differs from item`),
  ];
}
function topSelectionIssues(selection: Selection): string[] {
  const expected = expectedSelection(selection.candidate_audit, selection.tier).map((row) => row.candidate_key);
  const selected = selection.candidate_audit
    .filter((row) => row.outcome === "selected")
    .map((row) => row.candidate_key);
  if ([...expected].sort().join("|") === [...selected].sort().join("|")) return [];
  return [`selected rows are not the maximum top-scoring set allowed by the domestic-majority quota; expected [${expected.join(", ")}]`];
}
function qualifiedDropOutcomeIssues(selection: Selection): string[] {
  const qualified = selection.candidate_audit.filter((row) => qualifiesAt(row, selection.tier));
  const expectedSelected = new Set(
    expectedSelection(selection.candidate_audit, selection.tier).map((row) => row.candidate_key),
  );
  const unconstrainedTopTen = new Set(
    rankedCandidates(qualified).slice(0, MAXIMUM_VISIBLE_ITEMS).map((row) => row.candidate_key),
  );
  return qualified.flatMap((row) =>
    qualifiedDropOutcomeIssue(row, expectedSelected, unconstrainedTopTen)
  );
}
function qualifiedDropOutcomeIssue(
  row: CandidateAudit,
  expectedSelected: Set<string>,
  unconstrainedTopTen: Set<string>,
): string[] {
  if (expectedSelected.has(row.candidate_key)) return [];
  const expected = unconstrainedTopTen.has(row.candidate_key)
    ? "dropped_quota"
    : "dropped_capacity";
  return row.outcome === expected
    ? []
    : [`${row.candidate_key} must be ${expected}; got ${row.outcome}`];
}
function auditAccountingIssues(envelope: NewsEnvelope, selection: Selection): string[] {
  const count = (outcome: CandidateAudit["outcome"]) =>
    selection.candidate_audit.filter((row) => row.outcome === outcome).length;
  const safetyReported = Object.values(envelope.run_report.dropped_safety).reduce((sum, value) => sum + value, 0);
  const checks: [number, number, string][] = [
    [envelope.run_report.dropped_low_confidence, count("dropped_low_confidence"), "dropped_low_confidence"],
    [envelope.run_report.evidence_summary.dropped_insufficient_evidence, count("dropped_insufficient_evidence"), "dropped_insufficient_evidence"],
    [envelope.run_report.dropped_quota ?? 0, count("dropped_quota"), "dropped_quota"],
    [envelope.run_report.dropped_capacity ?? 0, count("dropped_capacity"), "dropped_capacity"],
    [safetyReported, count("dropped_safety"), "dropped_safety"],
  ];
  return checks.flatMap(([reported, actual, label]) =>
    reported === actual ? [] : [`run_report.${label}=${reported} does not match candidate audit=${actual}`]
  );
}
function selectionHeaderIssues(envelope: NewsEnvelope, selection: Selection): string[] {
  const expected = expectedTier(selection.candidate_audit);
  return [
    ...mismatchIssue(!selection.editorial_complete, "run_report.selection.editorial_complete must be true"),
    ...mismatchIssue(
      selection.candidate_audit.length !== envelope.run_report.candidates_scanned,
      "candidate_audit length does not match candidates_scanned",
    ),
    ...mismatchIssue(
      envelope.run_report.candidates_scanned < MINIMUM_CANDIDATE_POOL,
      `v3 research requires >=${MINIMUM_CANDIDATE_POOL} unique candidates`,
    ),
    ...mismatchIssue(
      selection.tier !== expected,
      `selection tier ${selection.tier} is not strictest quota-feasible tier ${expected}`,
    ),
  ];
}
function v3SelectionDetailIssues(envelope: NewsEnvelope, selection: Selection): string[] {
  const clockMs = newsSelectionClockMs(envelope);
  return [
    ...selection.candidate_audit.flatMap((row) => auditRowIssues(row, clockMs)),
    ...qualifiedCountIssues(selection),
    ...candidateOutcomeIssues(selection),
    ...selectionStatusIssues(envelope, selection),
    ...researchPassIssues(envelope, selection),
    ...safetyAuditLedgerIssues(envelope, selection.candidate_audit),
    ...auditIdentityIssues(envelope, selection),
    ...selectedItemAuditIssues(envelope, selection),
    ...topSelectionIssues(selection),
    ...qualifiedDropOutcomeIssues(selection),
    ...auditAccountingIssues(envelope, selection),
  ];
}
function requiresV3Selection(envelope: NewsEnvelope): boolean {
  if (!usesV3Policy(envelope)) return false;
  return ["published", "partial"].includes(envelope.status);
}
function v3SelectionIssues(envelope: NewsEnvelope): string[] {
  if (!requiresV3Selection(envelope)) return [];
  const selection = envelope.run_report.selection;
  if (!selection) return [`v3 envelope is missing run_report.selection`];
  return [
    ...selectionHeaderIssues(envelope, selection),
    ...v3SelectionDetailIssues(envelope, selection),
  ];
}
function v3HeatOrderingIssues(envelope: NewsEnvelope): string[] {
  if (!usesV3Policy(envelope)) return [];
  const ranked = [...visibleNews(envelope)].sort((left, right) => left.heat_rank - right.heat_rank);
  const scores = ranked.map((item) => item.score ?? -1);
  const ordered = scores.every((score, index) => index === 0 ? true : (scores[index - 1] ?? -1) >= score);
  return ordered ? [] : ["v3 heat_rank order must be non-increasing by editorial score"];
}
export function dailyNewsEditorialIssues(envelope: NewsEnvelope): string[] {
  if (!usesV3Policy(envelope)) return [];
  return [
    ...newsSelectionClockIssues(envelope),
    ...headlineEmojiIssues(envelope),
    ...v3ItemMetadataIssues(envelope),
    ...domesticMajorityIssues(envelope),
    ...internationalConcentrationIssues(envelope),
    ...v3SelectionIssues(envelope),
    ...v3HeatOrderingIssues(envelope),
  ];
}
