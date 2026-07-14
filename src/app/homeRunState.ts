/**
 * input: newest-first feed envelopes, latest visible count, and display labels
 * output: latest-run status, freshness marker, and stale/partial notice for the home shell
 * pos: pure app-composition helper shared by the meme and DailyNews feeds
 */
type FeedStatus = "published" | "partial" | "skipped" | "held";

type FeedEnvelope = {
  date: string;
  generated_at: string;
  published_at?: string;
  status: FeedStatus;
};

function publishTime(envelope: FeedEnvelope): string {
  return (envelope.published_at || envelope.generated_at).slice(11, 16);
}

function runNotice(
  envelope: FeedEnvelope,
  visibleCount: number,
  statusLabel: string,
  feedName: string,
): string | null {
  if (visibleCount === 0) {
    return `最近一次${feedName}运行 ${envelope.date} 状态为「${statusLabel}」，没有合格内容——下方展示的是最近一次有内容的发布。`;
  }
  if (envelope.status === "partial") {
    return `${envelope.date} 为部分发布（partial）。鉴于合格内容较少，当日发布可能少于每日目标。`;
  }
  return null;
}

export function homeRunState(
  envelopes: readonly FeedEnvelope[],
  firstVisibleDate: string | null,
  latestVisibleCount: number,
  labels: Readonly<Record<FeedStatus, string>>,
  feedName: string,
) {
  const latest = envelopes[0];
  if (!latest) return { status: null, freshDate: null, notice: null };
  const statusLabel = labels[latest.status];
  return {
    status: {
      date: latest.date,
      time: publishTime(latest),
      statusLabel,
      count: latestVisibleCount,
    },
    freshDate: firstVisibleDate === latest.date ? latest.date : null,
    notice: runNotice(latest, latestVisibleCount, statusLabel, feedName),
  };
}
