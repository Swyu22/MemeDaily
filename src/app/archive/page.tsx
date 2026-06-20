import { allVisibleItems } from "@/domain/memedaily/data";
import { sortByDecisionValue } from "@/domain/memedaily/labels";
import { ArchiveClient } from "@/features/memes/ArchiveClient";

export default function ArchivePage() {
  const rows = sortByDecisionValue(allVisibleItems());

  return (
    <main className="page">
      <section style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: "-0.01em" }}>梗库</h1>
        <p className="summary">跨天检索已发布的合格梗；跳过日和 held 日不会进入结果。</p>
      </section>
      <ArchiveClient rows={rows} />
    </main>
  );
}
