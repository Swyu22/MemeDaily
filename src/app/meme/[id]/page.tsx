import Link from "next/link";
import { notFound } from "next/navigation";
import { LinkIcon } from "lucide-react";
import { allVisibleItems, findItemById } from "@/domain/memedaily/data";
import { lifecycleLabels, platformLabels } from "@/domain/memedaily/labels";
import { CopyButtons } from "@/features/memes/CopyButtons";
import { MemeDetailFields } from "@/features/memes/MemeCard";

export async function generateStaticParams() {
  const items = allVisibleItems();
  if (items.length === 0) {
    return [{ id: "__placeholder__" }];
  }

  return items.map((item) => ({ id: item.id }));
}

export default function MemeDetailPage({ params }: { params: { id: string } }) {
  const item = findItemById(params.id);

  if (!item) {
    notFound();
  }

  return (
    <main className="page" style={{ maxWidth: 880 }}>
      <article className="detail-card" style={{ borderRadius: 14, padding: "30px 32px" }}>
        <div className="detail-head">
          <div>
            <Link href="/" className="button" style={{ marginBottom: 18 }}>
              返回今日台
            </Link>
            <h1 style={{ fontSize: 34 }}>{item.title}</h1>
            {item.aliases.length > 0 ? (
              <p className="summary">别名 {item.aliases.join(" / ")}</p>
            ) : null}
          </div>
          <div className="tag-row" style={{ marginTop: 0 }}>
            <span className="badge" data-life={item.lifecycle}>
              {lifecycleLabels[item.lifecycle]}
            </span>
            {item.score !== undefined ? (
              <span className="value">
                价值 <b className="mono">{item.score}</b>
              </span>
            ) : null}
          </div>
        </div>

        <div className="tag-row">
          <span className="mini">{item.platform.map((value) => platformLabels[value]).join(" · ")}</span>
          <span className="mini">{item.type}</span>
          <span className="mini mono">{item.date}</span>
          <span className="mini">
            <LinkIcon size={13} aria-hidden="true" />
            /meme/{item.id}
          </span>
        </div>

        <p style={{ fontSize: 18, lineHeight: 1.65, margin: "22px 0 0" }}>{item.summary}</p>

        <CopyButtons
          link={`https://memedaily.fun/meme/${item.id}/`}
          takeText={[
            `【${item.title}】${lifecycleLabels[item.lifecycle]} · ${item.type}`,
            `一句话：${item.summary}`,
            `品牌借用：${item.brand_usage}`,
            `风险：${item.risk.note}`,
            `链接：https://memedaily.fun/meme/${item.id}/`,
          ].join("\n")}
        />

        <MemeDetailFields item={item} />
      </article>
    </main>
  );
}
