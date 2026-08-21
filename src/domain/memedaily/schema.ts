/**
 * input: raw daily JSON envelopes from data/daily
 * output: parsed MemeDaily data and strict publication contract
 * pos: domain contract shared by build, validation scripts, and automation
 */
import { z } from "zod";

export const MEME_EDITORIAL_POLICY_VERSION = "v4-editorial-completeness";

export const PlatformSchema = z.enum([
  "weibo",
  "douyin",
  "xiaohongshu",
  "bilibili",
  "zhihu",
  "wechat",
  "other",
]);

export const MemeTypeSchema = z.enum([
  "热点事件梗",
  "短视频梗",
  "生活方式梗",
  "二创梗",
  "句式梗",
  "口头禅梗",
  "情绪梗",
  "职场梗",
  "其他",
]);

export const LifecycleSchema = z.enum(["rising", "peak", "declining"]);
export const RiskLevelSchema = z.enum(["safe", "low", "medium", "high"]);
export const StatusSchema = z.enum(["published", "partial", "skipped", "held"]);

export const EvidenceTierSchema = z.enum([
  "platform_public",
  "aggregator",
  "search_media",
  "spillover",
]);

export const EvidenceRoleSchema = z.enum([
  "origin",
  "popularity",
  "usage_context",
  "cross_platform",
]);

// Only http(s) links. z.string().url() alone ACCEPTS javascript:/data:/vbscript: URLs, which
// would render as a clickable <a href> on the static page (stored-XSS if a source url were ever
// poisoned). Constraining the scheme rejects them at validation + build time. All real sources are http(s).
const HttpUrlSchema = z
  .url()
  .refine((u) => /^https?:\/\//i.test(u), { message: "source url 必须是 http(s) 链接" });

const SourceSchema = z.object({
  tier: EvidenceTierSchema,
  evidence_role: EvidenceRoleSchema,
  platform: PlatformSchema,
  url: HttpUrlSchema,
  title: z.string().min(1).max(120).optional(),
  // Time shown by the evidence for the activity itself. This is deliberately
  // separate from captured_at, which only says when the page was opened.
  observed_at: z.iso.datetime({ offset: true }).optional(),
  captured_at: z.iso.datetime({ offset: true }),
  note: z.string().min(2).max(160),
});

const ScoreBreakdownSchema = z.object({
  heat: z.number().int().min(0).max(40),
  freshness: z.number().int().min(0).max(30),
  reusability: z.number().int().min(0).max(20),
  evidence: z.number().int().min(0).max(10),
});

export const MemeItemSchema = z.object({
  id: z.string().regex(/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/),
  title: z.string().min(1).max(48),
  aliases: z.array(z.string().min(1).max(48)).default([]),
  canonical_phrase: z.string().min(1).max(48).optional(),
  platform: z.array(PlatformSchema).min(1),
  type: MemeTypeSchema,
  summary: z.string().min(6).max(180),
  origin: z.string().min(6).max(360),
  usage: z.string().min(6).max(360),
  fun_point: z.string().min(6).max(360),
  why_spread: z.string().min(6).max(360),
  lifecycle: LifecycleSchema,
  brand_usage: z.string().min(6).max(360),
  risk: z.object({
    level: RiskLevelSchema,
    note: z.string().min(2).max(240),
  }),
  days_on_list: z.number().int().min(1).optional(),
  score: z.number().int().min(0).max(100).optional(),
  score_breakdown: ScoreBreakdownSchema.optional(),
  sources: z.array(SourceSchema).min(2),
  published: z.boolean().default(true),
});

const SelectionTierSchema = z.enum([
  "strict_24h",
  "relaxed_48h",
  "relaxed_72h",
]);

const SelectionQualifiedSchema = z.object({
  strict_24h: z.number().int().min(0),
  relaxed_48h: z.number().int().min(0),
  relaxed_72h: z.number().int().min(0),
});

const CandidateOutcomeSchema = z.enum([
  "selected",
  "dropped_safety",
  "dropped_low_confidence",
  "dropped_insufficient_evidence",
  "dropped_capacity",
]);

const CandidateActivitySchema = z.object({
  evidence_role: z.enum(["popularity", "usage_context", "cross_platform"]),
  url: HttpUrlSchema,
  observed_at: z.iso.datetime({ offset: true }),
});

export const CandidateAuditSchema = z.object({
  candidate_key: z.string().regex(/^[a-z0-9][a-z0-9-]{2,63}$/),
  canonical_phrase: z.string().min(1).max(48).optional(),
  outcome: CandidateOutcomeSchema,
  item_id: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/)
    .optional(),
  score: z.number().int().min(0).max(100).optional(),
  score_breakdown: ScoreBreakdownSchema.optional(),
  activity: CandidateActivitySchema.optional(),
  drop_reason: z.string().min(1).max(48).optional(),
  // Added in v4. Optional at the schema layer so committed v3 history remains readable;
  // the dynamic policy requires and reconciles it for every v4 candidate.
  research_pass: z.number().int().min(1).max(10).optional(),
}).strict();

const ResearchPassSchema = z.object({
  pass: z.number().int().min(1).max(10),
  candidates_added: z.number().int().min(1).max(100),
  cumulative_unique_candidates: z.number().int().min(1).max(100),
  sources_checked: z.array(PlatformSchema).min(1),
});

export const DailyEnvelopeSchema = z.object({
  schema_version: z.literal("1.0"),
  policy_version: z.string().min(1),
  rubric_version: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  generated_at: z.iso.datetime({ offset: true }),
  // Real publish/push moment (Asia/Shanghai), stamped deterministically by the publish step
  // (distinct from the agent-guessed generated_at). Drives the UI's 发布时间. Optional so the
  // agent's pre-publish file validates; trusted or supervised publish steps add it.
  published_at: z.iso.datetime({ offset: true }).optional(),
  status: StatusSchema,
  run_report: z.object({
    candidates_scanned: z.number().int().min(0),
    published: z.number().int().min(0),
    dropped_safety: z.record(z.string(), z.number().int().min(0)),
    dropped_low_confidence: z.number().int().min(0),
    dropped_capacity: z.number().int().min(0).optional(),
    sources: z.array(PlatformSchema),
    evidence_summary: z.object({
      candidates_with_urls: z.number().int().min(0),
      platform_public_sources: z.number().int().min(0),
      aggregator_sources: z.number().int().min(0),
      search_media_sources: z.number().int().min(0),
      spillover_sources: z.number().int().min(0),
      dropped_insufficient_evidence: z.number().int().min(0),
    }),
    selection: z
      .object({
        // Optional historical editorial clock. Trusted publication still stamps the real
        // generated_at/published_at; deterministic selection uses this clock when present.
        evaluated_at: z.iso.datetime({ offset: true }).optional(),
        tier: SelectionTierSchema,
        qualified: SelectionQualifiedSchema,
        candidate_audit: z.array(CandidateAuditSchema).min(30).max(100),
        // v4 declarations stay optional for backward-compatible parsing. The
        // deterministic gate requires and reconciles both fields for v4 data.
        editorial_complete: z.boolean().optional(),
        research_passes: z.array(ResearchPassSchema).min(1).max(10).optional(),
      })
      .optional(),
  }),
  items: z.array(MemeItemSchema).max(10),
});

export type Platform = z.infer<typeof PlatformSchema>;
export type Lifecycle = z.infer<typeof LifecycleSchema>;
export type MemeItem = z.infer<typeof MemeItemSchema>;
export type DailyEnvelope = z.infer<typeof DailyEnvelopeSchema>;
export type EvidenceTier = z.infer<typeof EvidenceTierSchema>;

export function memeSelectionClock(envelope: DailyEnvelope): string {
  return envelope.run_report.selection?.evaluated_at
    ?? envelope.published_at
    ?? envelope.generated_at;
}

export function memeSelectionClockMs(envelope: DailyEnvelope): number {
  return Date.parse(memeSelectionClock(envelope));
}

function shanghaiCalendarDate(timestamp: string): string {
  return new Date(Date.parse(timestamp) + 8 * 60 * 60 * 1_000).toISOString().slice(0, 10);
}

function clockMismatchIssue(mismatch: boolean, message: string): string[] {
  return mismatch ? [message] : [];
}

function laterThanIssue(value: string, upperBound: string | undefined, message: string): string[] {
  if (!upperBound) return [];
  return clockMismatchIssue(Date.parse(value) > Date.parse(upperBound), message);
}

export function memeSelectionClockIssues(envelope: DailyEnvelope): string[] {
  const evaluatedAt = envelope.run_report.selection?.evaluated_at;
  if (!evaluatedAt) return [];
  return [
    ...clockMismatchIssue(
      shanghaiCalendarDate(evaluatedAt) !== envelope.date,
      `${envelope.date} selection evaluated_at must fall on the envelope date`,
    ),
    ...laterThanIssue(
      evaluatedAt, envelope.generated_at,
      `${envelope.date} selection evaluated_at is after generated_at`,
    ),
    ...laterThanIssue(
      evaluatedAt, envelope.published_at,
      `${envelope.date} selection evaluated_at is after published_at`,
    ),
  ];
}

// Reader-facing projection sent to client components. Excluding brand_usage/risk here prevents
// those editorial fields from being serialized into homepage/archive payloads. This is a browser
// data-minimization boundary, NOT a confidentiality boundary: the repository and source JSON are public.
export type PublicMemeItem = Pick<
  MemeItem,
  | "id"
  | "title"
  | "aliases"
  | "platform"
  | "type"
  | "summary"
  | "origin"
  | "usage"
  | "fun_point"
  | "why_spread"
  | "lifecycle"
  | "days_on_list"
  | "score"
  | "score_breakdown"
  | "sources"
>;

export function toPublicMemeItem(item: MemeItem): PublicMemeItem {
  return {
    id: item.id,
    title: item.title,
    aliases: item.aliases,
    platform: item.platform,
    type: item.type,
    summary: item.summary,
    origin: item.origin,
    usage: item.usage,
    fun_point: item.fun_point,
    why_spread: item.why_spread,
    lifecycle: item.lifecycle,
    days_on_list: item.days_on_list,
    score: item.score,
    score_breakdown: item.score_breakdown,
    sources: item.sources,
  };
}
