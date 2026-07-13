/**
 * input: tracked GitHub Actions workflow text
 * output: regression assertions for token scope, tool confinement, SHA pins, and deploy gates
 * pos: static security-contract tests for unattended publishing
 */
import fs from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

const WORKFLOWS = path.join(process.cwd(), ".github/workflows");
const publishers = ["daily-publish.yml", "daily-news-publish.yml"];

it.each(publishers)("confines the model-facing job in %s", (name) => {
  const text = fs.readFileSync(path.join(WORKFLOWS, name), "utf8");
  const claudeArgs = text.split("\n").find((line) => line.includes("claude_args:")) ?? "";
  expect(text).toContain("github_token: ${{ github.token }}");
  expect(text).not.toContain("id-token: write");
  expect(claudeArgs).toContain("Read(./**)");
  expect(claudeArgs).not.toContain("Bash");
  expect(claudeArgs).toMatch(/Write\(data\/daily(?:-news)?\/\$\{\{/);
});

it("pins every external workflow action to a full commit SHA", () => {
  const files = fs.readdirSync(WORKFLOWS).filter((file) => file.endsWith(".yml"));
  for (const file of files) {
    const lines = fs.readFileSync(path.join(WORKFLOWS, file), "utf8").split("\n");
    for (const line of lines.filter((candidate) => /^-?\s*uses:/.test(candidate.trim()))) {
      if (line.includes("uses: ./")) continue;
      expect(line, `${file}: ${line.trim()}`).toMatch(/@[0-9a-f]{40}(?:\s|$)/);
    }
  }
});

it("requires canonical checks and successful correlated Pages dispatches", () => {
  const pages = fs.readFileSync(path.join(WORKFLOWS, "pages.yml"), "utf8");
  const meme = fs.readFileSync(path.join(WORKFLOWS, "daily-publish.yml"), "utf8");
  const news = fs.readFileSync(path.join(WORKFLOWS, "daily-news-publish.yml"), "utf8");
  expect(pages).toContain("npm run check");
  expect(meme).toContain('bash scripts/dispatch-pages.sh "$SHA"');
  expect(news).toContain('bash scripts/dispatch-pages.sh "$SHA"');
});
