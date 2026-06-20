"use client";

/**
 * input: prevalidated visible meme archive rows
 * output: client-side keyword/platform/type filtering for the static archive
 * pos: feature interaction layer with no filesystem access
 */
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { lifecycleLabels, platformLabels } from "@/domain/memedaily/labels";
import type { MemeItem, Platform } from "@/domain/memedaily/schema";

export type ArchiveRow = MemeItem & { date: string };

type ArchiveClientProps = {
  rows: ArchiveRow[];
};

export function ArchiveClient({ rows }: ArchiveClientProps) {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("全部");
  const [type, setType] = useState("全部");

  const platforms = ["全部", ...Array.from(new Set(rows.flatMap((row) => row.platform)))];
  const types = ["全部", ...Array.from(new Set(rows.map((row) => row.type)))];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((row) => {
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
      return true;
    });
  }, [platform, query, rows, type]);

  return (
    <>
      <label className="search-box">
        <Search size={18} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜梗名 / 别名 / 内容关键词"
        />
      </label>

      <div className="toolbar">
        <select className="select" value={platform} onChange={(event) => setPlatform(event.target.value)}>
          {platforms.map((value) => (
            <option key={value} value={value}>
              {value === "全部" ? value : platformLabels[value as keyof typeof platformLabels]}
            </option>
          ))}
        </select>
        <select className="select" value={type} onChange={(event) => setType(event.target.value)}>
          {types.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <span className="mini">匹配 {filtered.length} 个梗</span>
      </div>

      {filtered.length > 0 ? (
        <div className="result-list">
          {filtered.map((row) => (
            <a className="result-row" href={`/meme/${row.id}/index.html`} key={row.id}>
              <div>
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
                ) : null}
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
