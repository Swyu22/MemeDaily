/**
 * input: interactive component source and shared CSS
 * output: static accessibility regressions for clipboard feedback and search affordance
 * pos: lightweight UI contract checks that run in the canonical Vitest gate
 */
import fs from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

const ROOT = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), "utf8");

it("announces clipboard success and actionable failure", () => {
  const component = read("src/features/memes/CopyButtons.tsx");
  const css = read("src/app/globals.css");

  expect(component).toContain('role="status"');
  expect(component).toContain('aria-live="polite"');
  expect(component).toContain("剪贴板权限后重试");
  expect(css).toContain(".copy-feedback");
});

it("uses an ellipsis for the archive search hint", () => {
  const archive = read("src/features/memes/ArchiveClient.tsx");
  expect(archive).toContain('placeholder="搜梗名 / 别名 / 内容关键词…"');
});
