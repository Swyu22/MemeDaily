/**
 * input: raw daily JSON envelopes from data/daily-news
 * output: parsed DailyNews data and strict publication contract
 * pos: domain contract for the 日报 feed — shared by build, validation, and automation
 *
 * v2: a genuine 民生 daily-news digest — up to 10 heat-ranked items, news tone (新闻类标题),
 * close to everyday life (民生/节日/考试/会展/重大事件/科技/文化). The WeChat-bridge angle is
 * dropped from selection ("只做呈现"); wechat_bridge/filter_pass are now OPTIONAL legacy fields.
 * Reader-facing fields: headline/summary/category/heat_rank/sources(+outlet). risk stays internal.
 */
import { z } from "zod";

// Loose editorial buckets — broadened for the 民生 direction (less 国家高光, more 民生社会).
// Category is NO LONGER rendered (the chip cluttered layout); it only guides the agent's mix.
export const NewsCategorySchema = z.enum([
  "民生社会", // 高考/填报志愿/会展(广交会)/重大社会事件(含地震等)/与生活息息相关
  "节日节气", // 传统节日(母亲节/端午/五一)与节气
  "国家高光", // 航天/大国工程/重大科技突破/体育大赛（不宜过多）
  "国际", // 非政治国际新闻：全球科技/文化/体育/民生/自然/太空——每天至少 1 条
  "科技AI", // 科技与 AI 进展
  "科技向善", // 公益/寻人/助农/凡人善举
  "文化数字经济", // 文化非遗/国潮/数字经济/小店经济
]);

// Concrete WeChat capabilities a news item can bridge to. LEGACY/optional in v2 (bridge dropped).
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

// Only http(s) links — z.string().url() alone accepts javascript:/data: URLs that would render as a
// clickable <a href> (stored-XSS if a source url were ever poisoned). See memedaily/schema.ts (kept
// decoupled, redeclared here). All real news sources are http(s).
const HttpUrlSchema = z
  .url()
  .refine((u) => /^https?:\/\//i.test(u), { message: "source url 必须是 http(s) 链接" });

const NewsSourceSchema = z.object({
  tier: NewsTierSchema,
  outlet: z.string().min(1).max(20).optional(), // 媒体名（新华社/央视/澎湃…）— shown in 来源媒体
  url: HttpUrlSchema,
  title: z.string().min(1).max(120).optional(),
  captured_at: z.iso.datetime({ offset: true }),
  note: z.string().min(2).max(160),
});

export const NewsItemSchema = z.object({
  id: z.string().regex(/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/),
  headline: z.string().min(4).max(48), // 新闻类标题，含一个相关 emoji 前缀；不放伤亡/转移人数
  summary: z.string().min(6).max(150), // 新闻简述，约 100–150 字（平实完整，不玩梗）
  category: NewsCategorySchema,
  heat_rank: z.number().int().min(1).max(10), // 1 = hottest; gate enforces contiguous 1..N
  // 新闻"真实发生/披露时间"（Asia/Shanghai, offset）。用于「新鲜值」排序——越接近现在越靠前。
  // 与 source.captured_at（抓取时刻）不同。可选以兼容旧档；排序时缺失则回退到最新 captured_at。
  occurred_at: z.iso.datetime({ offset: true }).optional(),
  // --- INTERNAL editorial reasoning (validated, NEVER rendered) ---
  // wechat_bridge / filter_pass are LEGACY (v2 drops the bridge — "只做呈现"); kept OPTIONAL so
  // old envelopes still validate and the agent may omit them. risk stays a required safety note.
  wechat_bridge: z
    .object({
      capability: WechatCapabilitySchema,
      note: z.string().min(6).max(360),
    })
    .optional(),
  filter_pass: z
    .object({
      consensus: z.string().min(4).max(240),
      bridge_fit: z.string().min(4).max(240),
      tone_fit: z.string().min(4).max(240),
    })
    .optional(),
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
  generated_at: z.iso.datetime({ offset: true }),
  // Real publish moment (Asia/Shanghai), stamped deterministically by the publish step
  // (distinct from the agent-guessed generated_at). Optional so the agent's pre-publish file
  // validates; the publish step and the skipped-day fallback add it.
  published_at: z.iso.datetime({ offset: true }).optional(),
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
  "id" | "headline" | "summary" | "category" | "heat_rank" | "occurred_at" | "sources"
>;
