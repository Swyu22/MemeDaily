/**
 * input: parsed DailyNews envelopes and items
 * output: deterministic publication gate decisions for the 日报 feed
 * pos: domain policy layer — evidence bar, red-line content gate, heat-rank invariant
 */
import type { NewsEnvelope, NewsItem } from "./schema";

/**
 * News evidence bar (authority-weighted, stricter than memes — "未证实宁可不发"):
 * at least one `official`/`state_media` source IS enough; otherwise require >=2 distinct-URL
 * sources with at least one `major_media`. A lone `aggregator` (百度/微博热搜) never qualifies.
 */
export function hasPublishableEvidence(item: NewsItem): boolean {
  const uniqueUrls = new Set(item.sources.map((source) => source.url));
  const hasAuthoritative = item.sources.some(
    (source) => source.tier === "official" || source.tier === "state_media",
  );
  const hasMajorMedia = item.sources.some((source) => source.tier === "major_media");
  return hasAuthoritative || (uniqueUrls.size >= 2 && hasMajorMedia);
}

export function visibleNews(envelope: NewsEnvelope): NewsItem[] {
  if (envelope.status === "held" || envelope.status === "skipped") {
    return [];
  }
  return envelope.items.filter((item) => item.published && hasPublishableEvidence(item));
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
//  - 政府政策 IS a new red line: 政策/政府部署 framing reads too "官方/政府色彩" — exclude it so the
//    feed stays 民生. Government-organized LIFE events (高考/广交会/航天/体育) contain none of these
//    terms and pass cleanly; only abstract policy/directive framing is caught.
const RED_LINE_BUCKETS: { label: string; terms: string[] }[] = [
  {
    label: "政治/地缘/冲突",
    terms: [
      "首相", "总统", "总理", "国家主席", "大选", "弹劾", "政变", "白宫",
      "克里姆林", "执政党", "在野党", "外交", "制裁", "战争", "地缘",
    ],
  },
  {
    label: "政府/政策",
    terms: [
      "国务院", "政治局", "部委", "发改委", "印发", "出台", "规划纲要",
      "会议精神", "政府部署", "战略部署", "中央部署", "政策",
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

export function envelopeIssueSummary(envelope: NewsEnvelope): string[] {
  const issues: string[] = [];

  if (envelope.status === "published" && envelope.items.length === 0) {
    issues.push("published envelope cannot have zero items");
  }

  for (const item of envelope.items) {
    if (!hasPublishableEvidence(item)) {
      issues.push(`${item.id} lacks publishable evidence (need >=1 official/state_media, or >=2 URLs incl. major_media)`);
    }
  }

  if (envelope.run_report.published !== visibleNews(envelope).length) {
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

  // Same-day duplicate headlines (by normalized headline) within one envelope.
  const seen = new Map<string, string>();
  for (const item of visibleNews(envelope)) {
    const name = normalizeHeadline(item.headline);
    if (!name) continue;
    const prior = seen.get(name);
    if (prior && prior !== item.id) {
      issues.push(`${item.id} duplicates headline "${name}" already published today by ${prior}`);
    } else {
      seen.set(name, item.id);
    }
  }

  issues.push(...redLineIssues(envelope));
  issues.push(...heatRankIssues(envelope));

  return issues;
}
