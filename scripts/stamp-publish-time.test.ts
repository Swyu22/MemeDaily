import { describe, expect, it } from "vitest";
import { normalizePublishTimes, shanghaiTimestamp } from "./stamp-publish-time";

const fixture = {
  generated_at: "2026-07-13T09:00:00+08:00",
  published_at: "2026-07-13T07:00:00+08:00",
  items: [
    {
      sources: [
        { captured_at: "2026-07-13T06:30:00+08:00" },
        { captured_at: "2026-07-13T07:00:00+08:00" },
      ],
    },
  ],
};

describe("normalizePublishTimes", () => {
  it("uses one trusted timestamp for generation and publication", () => {
    const normalized = normalizePublishTimes(fixture, "2026-07-13T07:15:00+08:00");
    expect(normalized.generated_at).toBe("2026-07-13T07:15:00+08:00");
    expect(normalized.published_at).toBe("2026-07-13T07:15:00+08:00");
  });

  it("preserves source captures that precede the trusted time", () => {
    const normalized = normalizePublishTimes(fixture, "2026-07-13T07:15:00+08:00");
    expect(normalized.items[0]?.sources.map((source) => source.captured_at)).toEqual([
      "2026-07-13T06:30:00+08:00",
      "2026-07-13T07:00:00+08:00",
    ]);
  });

  it("rejects a source capture after the trusted runner time", () => {
    const futureFixture = structuredClone(fixture);
    const source = futureFixture.items[0]?.sources[1];
    if (source) source.captured_at = "2026-07-13T08:30:00+08:00";
    expect(() => normalizePublishTimes(futureFixture, "2026-07-13T07:15:00+08:00"))
      .toThrow("after trusted time");
  });

  it("rejects an invalid trusted timestamp", () => {
    expect(() => normalizePublishTimes(fixture, "not-a-time")).toThrow("Invalid publish timestamp");
  });
});

describe("shanghaiTimestamp", () => {
  it("formats an instant as a fixed +08:00 wall-clock value", () => {
    expect(shanghaiTimestamp(Date.parse("2026-07-12T23:15:42.000Z"))).toBe(
      "2026-07-13T07:15:42+08:00",
    );
  });
});
