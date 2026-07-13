"use client";

/**
 * input: prevalidated visible meme archive rows
 * output: client-side keyword/platform/type/lifecycle filtering + sort for the archive
 * pos: feature interaction layer with no filesystem access
 */
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  lifecycleLabels,
  platformLabels,
  sortByDateThenLife,
  sortByDecisionValue,
} from "@/domain/memedaily/labels";
import type { Lifecycle, MemeItem, Platform } from "@/domain/memedaily/schema";

// basePath prefix for raw <a> internal links (Next only rewrites next/link). See next.config.mjs.
const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type ArchiveRow = MemeItem & { date: string };

type ArchiveClientProps = {
  rows: ArchiveRow[];
};

const LIFECYCLES: Lifecycle[] = ["rising", "peak", "declining"];

export function ArchiveClient({ rows }: ArchiveClientProps) {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("全部");
  const [type, setType] = useState("全部");
  const [lifecycle, setLifecycle] = useState("全部");
  const [sort, setSort] = useState<"value" | "date">("date");

  const platforms = ["全部", ...Array.from(new Set(rows.flatMap((row) => row.platform)))];
  const types = ["全部", ...Array.from(new Set(rows.map((row) => row.type)))];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matched = rows.filter((row) => {
      const haystack = [
        row.title,
        ...row.aliases,
        row.summary,
        row.type,
        row.origin,
        row.usage,
      ]
        .join(" ")
        .toLowerCase();

      if (q && !haystack.includes(q)) return false;
      if (platform !== "全部" && !row.platform.includes(platform as Platform)) return false;
      if (type !== "全部" && row.type !== type) return false;
      if (lifecycle !== "全部" && row.lifecycle !== lifecycle) return false;
      return true;
    });

    if (sort === "date") {
      return sortByDateThenLife(matched);
    }
    return sortByDecisionValue(matched);
  }, [lifecycle, platform, query, rows, sort, type]);

  return (
    <>
      <label className="search-box">
        <Search size={18} aria-hidden="true" />
        <input
          aria-label="搜索梗库"
          autoComplete="off"
          name="archive-query"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜梗名 / 别名 / 内容关键词"
        />
      </label>

      <div className="toolbar">
        <select
          aria-label="平台筛选"
          className="select"
          name="archive-platform"
          value={platform}
          onChange={(event) => setPlatform(event.target.value)}
        >
          {platforms.map((value) => (
            <option key={value} value={value}>
              {value === "全部" ? value : platformLabels[value as keyof typeof platformLabels]}
            </option>
          ))}
        </select>
        <select
          aria-label="梗类型筛选"
          className="select"
          name="archive-type"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          {types.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={lifecycle}
          onChange={(event) => setLifecycle(event.target.value)}
          aria-label="生命周期阶段"
          name="archive-lifecycle"
        >
          <option value="全部">全部阶段</option>
          {LIFECYCLES.map((value) => (
            <option key={value} value={value}>
              {lifecycleLabels[value]}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={sort}
          onChange={(event) => setSort(event.target.value as "value" | "date")}
          aria-label="排序方式"
          name="archive-sort"
        >
          <option value="value">按价值</option>
          <option value="date">按日期</option>
        </select>
        <span className="mini" aria-live="polite">匹配 {filtered.length} 个梗</span>
      </div>

      {filtered.length > 0 ? (
        <div className="result-list">
          {filtered.map((row) => (
            <a className="result-row" href={`${BP}/meme/${row.id}/index.html`} key={row.id}>
              <div className="result-main">
                <strong>{row.title}</strong>
                <div className="summary">{row.summary}</div>
                <div className="tag-row">
                  <span className="mini">{row.type}</span>
                  <span className="mini">{row.platform.map((value) => platformLabels[value]).join(" · ")}</span>
                  <span className="mini mono">{row.date}</span>
                </div>
              </div>
              <div className="tag-row" style={{ marginTop: 0 }}>
                <span className="badge" data-life={row.lifecycle}>
                  {lifecycleLabels[row.lifecycle]}
                </span>
                {row.score !== undefined ? (
                  <span className="value">
                    价值 <b className="mono">{row.score}</b>
                  </span>
                ) : (
                  <span className="mini">未评分</span>
                )}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="empty">没找到匹配的梗。换个关键词，或放宽筛选条件。</div>
      )}
    </>
  );
}
