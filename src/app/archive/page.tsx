/**
 * input: all validated visible meme items
 * output: statically rendered archive shell with client-side filters
 * pos: App Router archive composition boundary
 */
import { allVisibleItems } from "@/domain/memedaily/data";
import { dedupeRecurring } from "@/domain/memedaily/rules";
import { ArchiveClient } from "@/features/memes/ArchiveClient";

export default function ArchivePage() {
  // allVisibleItems is date-desc, so dedupeRecurring keeps each meme's most-recent occurrence.
  const rows = dedupeRecurring(allVisibleItems());

  return (
    <main className="page" id="main-content">
      <section style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>梗库</h1>
        <p className="summary">跨天检索已发布的合格梗；跳过日和 held 日不会进入结果。</p>
      </section>
      <ArchiveClient rows={rows} />
    </main>
  );
}
