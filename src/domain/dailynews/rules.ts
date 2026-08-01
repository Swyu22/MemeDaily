/**
 * input: parsed DailyNews envelopes and items
 * output: deterministic publication gate decisions for the 日报 feed
 * pos: domain policy layer — evidence bar, red-line content gate, heat-rank invariant
 */
import {
  NEWS_EDITORIAL_POLICY_VERSION,
  type NewsEnvelope,
  type NewsItem,
} from "./schema";
import {
  dailyNewsEditorialIssues,
  hasNewsEvidence,
  usesInternationalEvidence,
  visibleNewsItems,
} from "./editorial-policy";

const MINIMUM_DAILY_PUBLICATION_DATE = "2026-07-26";
const MINIMUM_VISIBLE_ITEMS = 3;

function usesV3Policy(envelope: NewsEnvelope): boolean {
  return envelope.policy_version === NEWS_EDITORIAL_POLICY_VERSION;
}

/**
 * News evidence bar (authority-weighted, stricter than memes — "未证实宁可不发"):
 * at least one `official`/`state_media` source IS enough; otherwise require >=2 distinct-URL
 * sources with at least one `major_media`. A lone `aggregator` (百度/微博热搜) never qualifies.
 */
export function hasPublishableEvidence(item: NewsItem, policyVersion?: string): boolean {
  return hasNewsEvidence(item, policyVersion);
}

export function visibleNews(envelope: NewsEnvelope): NewsItem[] {
  return visibleNewsItems(envelope);
}

/**
 * Preserve historical skipped/held archives while enforcing the owner's minimum-output
 * contract for every new day. Operator-held envelopes remain a valid emergency removal
 * state, not a successful publication. Only reader-visible, evidence-qualified items count.
 */
export function minimumDailyPublicationIssues(envelope: NewsEnvelope): string[] {
  if (minimumPublicationExempt(envelope)) return [];

  const visibleCount = visibleNews(envelope).length;
  const publishableStatus = ["published", "partial"].includes(envelope.status);
  if (!publishableStatus) return minimumPublicationIssue(envelope, visibleCount);
  if (visibleCount < MINIMUM_VISIBLE_ITEMS) return minimumPublicationIssue(envelope, visibleCount);

  return [];
}
function minimumPublicationExempt(envelope: NewsEnvelope): boolean {
  if (envelope.date < MINIMUM_DAILY_PUBLICATION_DATE) return true;
  return envelope.status === "held";
}
function minimumPublicationIssue(envelope: NewsEnvelope, visibleCount: number): string[] {
  return [
    `${envelope.date} requires status published/partial with at least ${MINIMUM_VISIBLE_ITEMS} visible items; got ${envelope.status} with ${visibleCount}`,
  ];
}
function normalizeHeadline(value: string): string {
  return Array.from(value.toLowerCase())
    .filter((ch) => /[\p{L}\p{N}]/u.test(ch))
    .join("");
}

// Code-enforced hard-avoid gate (the stricter analog of the meme politics gate). News inherently
// names events, so we scan ONLY the READER-FACING copy (headline + summary) — never the agent's
// internal reasoning fields (filter_pass / risk.note), which routinely contain NEGATIONS like
// "无争议 / 不涉及地缘" that would false-positive. A hit fails validation so the agent self-corrects.
// Keep the lists high-signal and reviewable; start narrow and widen only from real misses.
//
// v2 EDITORIAL SHIFT (per user):
//  - 灾难/事故 is NO LONGER a red line. 民生 news legitimately covers major events people care about
//    (四川宜宾地震 was named as a WANTED example); the bucket is dropped. The tone discipline
//    (factual, restrained, no casualty-sensationalism) is enforced via the PROMPT, not a keyword gate.
//  - Broad words such as 政策/出台/部委 are NOT red lines: they also occur in useful domestic
//    livelihood reporting. Keep only high-signal political-propaganda and meeting framing here.
const RED_LINE_BUCKETS: { label: string; terms: string[] }[] = [
  {
    label: "政治/地缘/冲突",
    terms: [
      "首相", "总统", "总理", "国家主席", "大选", "弹劾", "政变", "白宫",
      "克里姆林", "执政党", "在野党", "外交", "制裁", "战争", "地缘",
    ],
  },
  {
    label: "政治宣传/会议",
    terms: [
      "政治局", "会议精神", "政府部署", "战略部署", "中央部署",
      "贯彻落实", "学习贯彻", "重要讲话精神",
    ],
  },
  {
    label: "明星丑闻",
    terms: ["出轨", "离婚", "绯闻", "塌房", "丑闻", "恋情", "分手", "劈腿"],
  },
  {
    label: "争议对立",
    terms: ["争议", "抵制", "站队", "互撕", "网暴", "对立", "骂战"],
  },
];

export function redLineIssues(envelope: NewsEnvelope): string[] {
  const issues: string[] = [];
  for (const item of visibleNews(envelope)) {
    const readerText = `${item.headline} ${item.summary}`;
    for (const bucket of RED_LINE_BUCKETS) {
      const hit = bucket.terms.find((term) => readerText.includes(term));
      if (hit) {
        issues.push(`${item.id} headline/summary contains red-line term "${hit}" (${bucket.label}) — 必须丢弃`);
      }
    }
  }
  return issues;
}

// Casualty/relocation FIGURES must not appear in a headline (per user): disaster headlines should
// lead with the event + response and keep "X人遇难 / X人轻伤 / X人转移" in the summary. We flag a
// headline ONLY when it contains BOTH a "数字+人" count AND a casualty/relocation word — so neutral
// counts like "3亿人观看" or "10万人打卡" never trip it. Scans the headline only.
const HEADLINE_PEOPLE_COUNT_RE = /\d[\d,，]*\s*(?:余|多|名)?\s*人/;
const HEADLINE_CASUALTY_WORDS = [
  "死", "亡", "遇难", "罹难", "遇害", "伤", "失联", "被困", "遇险", "获救", "转移", "疏散", "安置",
];
const HEADLINE_CASUALTY_RE = new RegExp(HEADLINE_CASUALTY_WORDS.join("|"));

export function headlineCasualtyIssues(envelope: NewsEnvelope): string[] {
  const issues: string[] = [];
  for (const item of visibleNews(envelope)) {
    const headline = item.headline;
    if (
      HEADLINE_PEOPLE_COUNT_RE.test(headline) &&
      HEADLINE_CASUALTY_RE.test(headline)
    ) {
      issues.push(
        `${item.id} 标题含具体伤亡/转移人数，请移到 summary（标题只写事件+响应）: "${headline}"`,
      );
    }
  }
  return issues;
}

// Ordering invariant: visible items' heat_rank must be exactly the contiguous set 1..N
// (no gaps, no duplicates) so "由上到下按热点" is unambiguous and the UI sorts by rank verbatim.
export function heatRankIssues(envelope: NewsEnvelope): string[] {
  const ranks = visibleNews(envelope)
    .map((item) => item.heat_rank)
    .sort((a, b) => a - b);
  if (ranks.length === 0) return [];
  const contiguous = ranks.every((rank, index) => rank === index + 1);
  if (!contiguous) {
    return [`heat_rank must be contiguous 1..${ranks.length} for visible items; got [${ranks.join(", ")}]`];
  }
  return [];
}

// Legacy-only warning. v3 deliberately has no international minimum: a three-item digest must be
// entirely domestic, and international stories appear only when they satisfy the hard 25% cap.
export function internationalCoverageWarnings(envelope: NewsEnvelope): string[] {
  if (usesV3Policy(envelope)) return [];
  const visible = visibleNews(envelope);
  if (visible.length === 0) return [];
  const intl = visible.filter((item) => item.category === "国际").length;
  if (intl === 0) {
    return [`no 国际 item today — aim for >=1 non-political international story (soft target)`];
  }
  return [];
}
function publishedEmptyIssues(envelope: NewsEnvelope): string[] {
  const emptyPublication = envelope.status === "published" && envelope.items.length === 0;
  return emptyPublication ? ["published envelope cannot have zero items"] : [];
}
function evidenceRequirement(envelope: NewsEnvelope, item: NewsItem): string {
  if (usesInternationalEvidence(item, envelope.policy_version)) {
    return ">=2 independent URLs/outlets including state_media or major_media";
  }
  return ">=1 official/state_media, or >=2 URLs incl. major_media";
}
function itemEvidenceIssues(envelope: NewsEnvelope, item: NewsItem): string[] {
  if (hasPublishableEvidence(item, envelope.policy_version)) return [];
  return [`${item.id} lacks publishable evidence (need ${evidenceRequirement(envelope, item)})`];
}
function evidenceIssues(envelope: NewsEnvelope): string[] {
  return envelope.items.flatMap((item) => itemEvidenceIssues(envelope, item));
}
function reportedCountIssues(envelope: NewsEnvelope): string[] {
  return envelope.run_report.published === visibleNews(envelope).length
    ? []
    : ["run_report.published does not match visible item count"];
}
function generatedTimeIssues(envelope: NewsEnvelope, publishedMs: number | undefined): string[] {
  const generatedMs = Date.parse(envelope.generated_at);
  if (publishedMs === undefined) return [];
  return generatedMs > publishedMs
    ? [`generated_at ${envelope.generated_at} is after published_at ${envelope.published_at}`]
    : [];
}
function sourceTimeIssue(item: NewsItem, capturedAt: string, cutoff: number, label: string): string[] {
  if (Date.parse(capturedAt) <= cutoff) return [];
  return [`${item.id} source captured_at ${capturedAt} is after ${label}`];
}
function sourceTimeIssues(envelope: NewsEnvelope, publishedMs: number | undefined): string[] {
  const generatedMs = Date.parse(envelope.generated_at);
  const sourceCutoffMs = publishedMs ?? generatedMs;
  const sourceCutoffLabel = publishedMs === undefined ? "generated_at" : "published_at";
  return envelope.items.flatMap((item) =>
    item.sources.flatMap((source) =>
      sourceTimeIssue(item, source.captured_at, sourceCutoffMs, sourceCutoffLabel)
    )
  );
}
function temporalIssues(envelope: NewsEnvelope): string[] {
  const publishedMs = envelope.published_at ? Date.parse(envelope.published_at) : undefined;
  return [
    ...generatedTimeIssues(envelope, publishedMs),
    ...sourceTimeIssues(envelope, publishedMs),
  ];
}
function duplicateHeadlineIssue(item: NewsItem, seen: Map<string, string>): string[] {
  const name = normalizeHeadline(item.headline);
  if (!name) return [];
  const prior = seen.get(name);
  if (prior && prior !== item.id) {
    return [`${item.id} duplicates headline "${name}" already published today by ${prior}`];
  }
  seen.set(name, item.id);
  return [];
}
function duplicateHeadlineIssues(envelope: NewsEnvelope): string[] {
  const seen = new Map<string, string>();
  return visibleNews(envelope).flatMap((item) => duplicateHeadlineIssue(item, seen));
}

export function envelopeIssueSummary(envelope: NewsEnvelope): string[] {
  return [
    ...minimumDailyPublicationIssues(envelope),
    ...publishedEmptyIssues(envelope),
    ...evidenceIssues(envelope),
    ...reportedCountIssues(envelope),
    ...temporalIssues(envelope),
    ...duplicateHeadlineIssues(envelope),
    ...redLineIssues(envelope),
    ...headlineCasualtyIssues(envelope),
    ...heatRankIssues(envelope),
    ...dailyNewsEditorialIssues(envelope),
  ];
}
