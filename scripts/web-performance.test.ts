/**
 * input: home-shell and feed navigation source
 * output: regression assertion that the large archive payload is loaded only on explicit intent
 * pos: static web-performance contract for the canonical Vitest gate
 */
import fs from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

const ROOT = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), "utf8");

it("does not prefetch the large archive route from the home page", () => {
  const sources = [read("src/app/layout.tsx"), read("src/features/memes/TodayFeed.tsx")];

  for (const source of sources) {
    expect(source).toMatch(/<Link[^>]+href="\/archive\/"[^>]+prefetch=\{false\}/);
  }
});
