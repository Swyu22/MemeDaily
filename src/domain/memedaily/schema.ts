/**
 * input: raw daily JSON envelopes from data/daily
 * output: parsed MemeDaily data and strict publication contract
 * pos: domain contract shared by build, validation scripts, and automation
 */
import { z } from "zod";

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

const SourceSchema = z.object({
  tier: EvidenceTierSchema,
  evidence_role: EvidenceRoleSchema,
  platform: PlatformSchema,
  url: z.string().url(),
  captured_at: z.string().datetime({ offset: true }),
  note: z.string().min(2).max(160),
});

export const MemeItemSchema = z.object({
  id: z.string().regex(/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/),
  title: z.string().min(1).max(48),
  aliases: z.array(z.string().min(1).max(48)).default([]),
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
  sources: z.array(SourceSchema).min(2),
  published: z.boolean().default(true),
});

export const DailyEnvelopeSchema = z.object({
  schema_version: z.literal("1.0"),
  policy_version: z.string().min(1),
  rubric_version: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  generated_at: z.string().datetime({ offset: true }),
  status: StatusSchema,
  run_report: z.object({
    candidates_scanned: z.number().int().min(0),
    published: z.number().int().min(0),
    dropped_safety: z.record(z.string(), z.number().int().min(0)),
    dropped_low_confidence: z.number().int().min(0),
    sources: z.array(PlatformSchema),
    evidence_summary: z.object({
      candidates_with_urls: z.number().int().min(0),
      platform_public_sources: z.number().int().min(0),
      aggregator_sources: z.number().int().min(0),
      search_media_sources: z.number().int().min(0),
      spillover_sources: z.number().int().min(0),
      dropped_insufficient_evidence: z.number().int().min(0),
    }),
  }),
  items: z.array(MemeItemSchema).max(10),
});

export type Platform = z.infer<typeof PlatformSchema>;
export type MemeItem = z.infer<typeof MemeItemSchema>;
export type DailyEnvelope = z.infer<typeof DailyEnvelopeSchema>;
export type EvidenceTier = z.infer<typeof EvidenceTierSchema>;
