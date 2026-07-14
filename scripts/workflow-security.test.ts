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
const writers = [...publishers, "daily-fallback.yml", "daily-news-fallback.yml"];
const NODE24_ACTIONS = new Map([
  ["actions/checkout", "9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0"],
  ["actions/setup-node", "48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e"],
  ["actions/configure-pages", "45bfe0192ca1faeb007ade9deae92b16b8254a0d"],
  ["actions/upload-pages-artifact", "fc324d3547104276b827a68afc52ff2a11cc49c9"],
  ["actions/deploy-pages", "cd2ce8fcbc39b97be8ca5fce6e763baed58fa128"],
  ["actions/upload-artifact", "043fb46d1a93c77aae656e7c1c64a875d1fc6a0a"],
  ["actions/download-artifact", "3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c"],
]);

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

it("uses the reviewed Node 24 releases for official JavaScript actions", () => {
  const text = fs.readdirSync(WORKFLOWS)
    .filter((file) => file.endsWith(".yml"))
    .map((file) => fs.readFileSync(path.join(WORKFLOWS, file), "utf8"))
    .join("\n");
  for (const [action, sha] of NODE24_ACTIONS) {
    expect(text).toContain(`${action}@${sha}`);
    expect(text.match(new RegExp(`${action}@(?!${sha})`, "g")) ?? []).toHaveLength(0);
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

it.each(writers)("revalidates the final rebased tree before token-scoped push in %s", (name) => {
  const workflow = fs.readFileSync(path.join(WORKFLOWS, name), "utf8");
  const rebase = workflow.lastIndexOf("git pull --rebase origin main");
  const finalInstall = workflow.lastIndexOf("npm ci");
  const finalCheck = workflow.lastIndexOf("npm run check");
  const writeToken = workflow.lastIndexOf("GH_TOKEN:");
  const push = workflow.lastIndexOf("git push");

  expect(rebase).toBeGreaterThan(-1);
  expect(finalInstall).toBeGreaterThan(rebase);
  expect(finalCheck).toBeGreaterThan(finalInstall);
  expect(writeToken).toBeGreaterThan(finalCheck);
  expect(push).toBeGreaterThan(writeToken);
});

it("keeps MemeDaily monitor issue lookup isolated from DailyNews issues", () => {
  const monitor = fs.readFileSync(path.join(WORKFLOWS, "daily-monitor.yml"), "utf8");

  expect(monitor).toContain('contains(\\"MemeDaily 成本异常: ${DATE}\\")');
  expect(monitor).toContain('contains(\\"MemeDaily 未发布告警: ${DATE}\\")');
  expect(monitor).not.toContain('select(.title|contains(\\"${DATE}\\"))');
});
