import { describe, expect, it } from "vitest";
import { sortByFreshness, sortByHeat } from "./labels";
import type { MemeItem } from "./schema";

type Sortable = Pick<
  MemeItem,
  "days_on_list" | "lifecycle" | "score" | "score_breakdown"
> & { name: string };

function scored(
  name: string,
  heat: number,
  freshness: number,
  daysOnList: number,
  total: number,
): Sortable {
  return {
    name,
    lifecycle: "rising",
    days_on_list: daysOnList,
    score: total,
    score_breakdown: {
      heat,
      freshness,
      reusability: 18,
      evidence: 8,
    },
  };
}

describe("MemeDaily dynamic feed sorting", () => {
  it("lets a genuinely fresh recurrence outrank a weaker new item", () => {
    const recurring = scored("recurring", 34, 29, 5, 89);
    const newButWeak = scored("new", 30, 18, 1, 74);
    expect(sortByFreshness([newButWeak, recurring])[0]!.name).toBe("recurring");
  });

  it("uses the heat component before the aggregate score", () => {
    const hotter = scored("hotter", 39, 18, 2, 83);
    const higherTotal = scored("higher-total", 28, 30, 1, 88);
    higherTotal.score_breakdown = {
      heat: 28,
      freshness: 30,
      reusability: 20,
      evidence: 10,
    };
    expect(sortByHeat([higherTotal, hotter])[0]!.name).toBe("hotter");
  });
});

describe("MemeDaily historical feed sorting", () => {
  it("retains the historical freshness fallback without score breakdown", () => {
    const older: Sortable = {
      name: "older",
      lifecycle: "peak",
      days_on_list: 3,
      score: 90,
    };
    const rising: Sortable = {
      name: "rising",
      lifecycle: "rising",
      days_on_list: 1,
      score: 70,
    };
    expect(sortByFreshness([older, rising])[0]!.name).toBe("rising");
  });
});
