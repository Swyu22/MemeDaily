/**
 * input: raw daily JSON envelopes from data/daily-news
 * output: parsed DailyNews data and strict publication contract
 * pos: domain contract for the 日报 feed — shared by build, validation, and automation
 *
 * Mirrors memedaily/schema.ts but for a different content type: up to 10 heat-ranked daily
 * news items curated through a WeChat-official-account lens. Reader-facing fields are the
 * headline/summary/category/heat_rank/sources; wechat_bridge, filter_pass and risk are
 * INTERNAL editorial reasoning (validated for presence, never rendered — like meme brand_usage).
 */
import { z } from "zod";

// The five priority categories, ordered most→least preferred (see DAILYNEWS prompt).
export const NewsCategorySchema = z.enum([
  "国家高光", // 航天/大国工程/重大科技突破/体育大赛
  "节日节气", // 传统节日与节气
  "科技AI", // 科技与 AI 进展
  "科技向善", // 公益/寻人/助农/灾时连接协作/凡人善举
  "文化数字经济", // 文化非遗/国潮/数字经济/小店经济
]);

// Concrete WeChat capabilities a news item can bridge to. INTERNAL selection signal only —
// requiring an enum forces the agent to name a real capability, not hand-wave.
export const WechatCapabilitySchema = z.enum([
  "视频号直播",
  "视频号创作者",
  "红包封面",
  "微信状态",
  "微信公益寻人",
  "灾害群聊救援",
  "元宝AI",
  "AI搜索",
  "小程序",
  "微信小店",
  "朋友圈",
  "群聊",
]);

// Redeclared (not imported from memedaily) to keep the two domains fully decoupled.
export const RiskLevelSchema = z.enum(["safe", "low", "medium", "high"]);
export const StatusSchema = z.enum(["published", "partial", "skipped", "held"]);

// Authoritative-outlet tiers, strongest→weakest. An `aggregator` alone never qualifies.
export const NewsTierSchema = z.enum([
  "official", // 政府发布/官方机构/官方蓝V (gov.cn 等)
  "state_media", // 新华社/人民日报/央视
  "major_media", // 主流持牌媒体 (澎湃/界面/第一财经 等)
  "aggregator", // 百度热搜新闻类/微博热搜要闻 — 仅佐证，不可单独成立
]);

const NewsSourceSchema = z.object({
  tier: NewsTierSchema,
  url: z.string().url(),
  title: z.string().min(1).max(120).optional(),
  captured_at: z.string().datetime({ offset: true }),
  note: z.string().min(2).max(160),
});

export const NewsItemSchema = z.object({
  id: z.string().regex(/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/),
  headline: z.string().min(4).max(48),
  summary: z.string().min(6).max(120), // shorter than meme summary — enforce 克制
  category: NewsCategorySchema,
  heat_rank: z.number().int().min(1).max(10), // 1 = hottest; gate enforces contiguous 1..N
  // --- INTERNAL editorial reasoning (validated, NEVER rendered) ---
  wechat_bridge: z.object({
    capability: WechatCapabilitySchema,
    note: z.string().min(6).max(360),
  }),
  filter_pass: z.object({
    consensus: z.string().min(4).max(240), // (a) 最大公约数/非争议
    bridge_fit: z.string().min(4).max(240), // (b) 可桥接到具体微信能力
    tone_fit: z.string().min(4).max(240), // (c) 克制/有温度/不喧哗
  }),
  risk: z.object({
    level: RiskLevelSchema,
    note: z.string().min(2).max(240),
  }),
  // --- evidence + publish flag ---
  sources: z.array(NewsSourceSchema).min(1), // authority bar enforced in rules.ts
  published: z.boolean().default(true),
});

export const NewsEnvelopeSchema = z.object({
  schema_version: z.literal("1.0"),
  policy_version: z.string().min(1),
  rubric_version: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  generated_at: z.string().datetime({ offset: true }),
  // Real publish moment (Asia/Shanghai), stamped deterministically by the publish step
  // (distinct from the agent-guessed generated_at). Optional so the agent's pre-publish file
  // validates; the publish step and the skipped-day fallback add it.
  published_at: z.string().datetime({ offset: true }).optional(),
  status: StatusSchema,
  run_report: z.object({
    candidates_scanned: z.number().int().min(0),
    published: z.number().int().min(0),
    dropped_safety: z.record(z.string(), z.number().int().min(0)),
    dropped_low_confidence: z.number().int().min(0),
    sources: z.array(NewsTierSchema),
    evidence_summary: z.object({
      candidates_with_urls: z.number().int().min(0),
      official_sources: z.number().int().min(0),
      state_media_sources: z.number().int().min(0),
      major_media_sources: z.number().int().min(0),
      aggregator_sources: z.number().int().min(0),
      dropped_insufficient_evidence: z.number().int().min(0),
    }),
  }),
  items: z.array(NewsItemSchema).max(10),
});

export type NewsCategory = z.infer<typeof NewsCategorySchema>;
export type WechatCapability = z.infer<typeof WechatCapabilitySchema>;
export type NewsTier = z.infer<typeof NewsTierSchema>;
export type NewsItem = z.infer<typeof NewsItemSchema>;
export type NewsEnvelope = z.infer<typeof NewsEnvelopeSchema>;

// Reader-facing projection sent to the client: the internal editorial fields
// (wechat_bridge / filter_pass / risk) are deliberately EXCLUDED so they never reach the
// browser — not rendered AND not embedded in the page's serialized data. The server page
// must map NewsItem -> PublicNewsItem before passing it into client components.
export type PublicNewsItem = Pick<
  NewsItem,
  "id" | "headline" | "summary" | "category" | "heat_rank" | "sources"
>;
