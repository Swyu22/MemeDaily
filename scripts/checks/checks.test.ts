/**
 * input: governance shell gates plus adversarial staged-index/worktree divergence fixtures
 * output: regression proof that every hard pre-commit gate evaluates committed bytes
 * pos: integration tests for the collaboration OS mechanical boundary
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, expect, it } from "vitest";

const ROOT = process.cwd();
const repos: string[] = [];

function run(cwd: string, command: string, args: string[], env: Record<string, string> = {}) {
  return spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

function write(repo: string, relativePath: string, content: string): void {
  const target = path.join(repo, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function fixture(scriptName: string): string {
  const repo = fs.mkdtempSync(path.join(ROOT, ".gate-fixture-"));
  repos.push(repo);
  const relative = `scripts/checks/${scriptName}`;
  write(repo, relative, fs.readFileSync(path.join(ROOT, relative), "utf8"));
  expect(run(repo, "git", ["init", "-q"]).status).toBe(0);
  expect(run(repo, "git", ["config", "user.email", "audit@example.test"]).status).toBe(0);
  expect(run(repo, "git", ["config", "user.name", "Audit Fixture"]).status).toBe(0);
  return repo;
}

function commit(repo: string): void {
  expect(run(repo, "git", ["add", "."]).status).toBe(0);
  expect(run(repo, "git", ["commit", "-qm", "fixture"]).status).toBe(0);
}

afterEach(() => {
  for (const repo of repos.splice(0)) fs.rmSync(repo, { recursive: true, force: true });
});

it("secret scanning reads the staged blob rather than a cleaned worktree", () => {
  const repo = fixture("check-secrets.sh");
  write(repo, "probe.txt", "safe\n");
  commit(repo);
  write(repo, "probe.txt", `ghp_${"A".repeat(36)}\n`);
  expect(run(repo, "git", ["add", "probe.txt"]).status).toBe(0);
  write(repo, "probe.txt", "safe again\n");
  expect(run(repo, "bash", ["scripts/checks/check-secrets.sh", "staged"]).status).toBe(1);
});

it("file-size scanning reads the staged blob rather than a short worktree", () => {
  const repo = fixture("check-file-size.sh");
  write(repo, "probe.ts", "export {};\n");
  commit(repo);
  write(repo, "probe.ts", `${Array.from({ length: 801 }, () => "x").join("\n")}\n`);
  expect(run(repo, "git", ["add", "probe.ts"]).status).toBe(0);
  write(repo, "probe.ts", "export {};\n");
  const result = run(repo, "bash", ["scripts/checks/check-file-size.sh", "staged"], { STRICT: "1" });
  expect(result.status).toBe(1);
});

it("key-header scanning rejects a staged header removed behind a valid worktree", () => {
  const repo = fixture("check-key-file-header.sh");
  write(repo, "quality/key-files.txt", "key.ts\n");
  write(repo, "key.ts", "// input: x\n// output: y\n// pos: z\n");
  commit(repo);
  write(repo, "key.ts", "export {};\n");
  expect(run(repo, "git", ["add", "key.ts"]).status).toBe(0);
  write(repo, "key.ts", "// input: x\n// output: y\n// pos: z\n");
  const result = run(repo, "bash", ["scripts/checks/check-key-file-header.sh", "staged"], { STRICT: "1" });
  expect(result.status).toBe(1);
});

it("state scanning rejects invalid staged frontmatter hidden by the worktree", () => {
  const repo = fixture("check-state-fresh.sh");
  const valid = "---\ngoal: audit\ntier: micro\nactive_session: session.md\nupdated: 2026-07-13\n---\n";
  write(repo, "session.md", "# Session\n");
  write(repo, ".cloud.md", valid);
  commit(repo);
  write(repo, ".cloud.md", valid.replace("tier: micro", "tier: invalid"));
  expect(run(repo, "git", ["add", ".cloud.md"]).status).toBe(0);
  write(repo, ".cloud.md", valid);
  expect(run(repo, "bash", ["scripts/checks/check-state-fresh.sh", "staged"]).status).toBe(1);
});

it("import scanning catches staged alias imports hidden by the worktree", () => {
  const repo = fixture("check-import-boundaries.sh");
  write(repo, "quality/import-boundaries.txt", "src/domain/** ==> (@/|src/|(\\.\\./)+)features/\n");
  write(repo, "src/domain/example.ts", "export const value = 1;\n");
  commit(repo);
  write(repo, "src/domain/example.ts", "import x from \"@/features/x\";\nexport default x;\n");
  expect(run(repo, "git", ["add", "src/domain/example.ts"]).status).toBe(0);
  write(repo, "src/domain/example.ts", "export const value = 1;\n");
  const result = run(repo, "bash", ["scripts/checks/check-import-boundaries.sh", "staged"], { STRICT: "1" });
  expect(result.status).toBe(1);
});

it("tier suggestion handles an empty staged diff", () => {
  const repo = fixture("suggest-tier.sh");
  commit(repo);
  const result = run(repo, "bash", ["scripts/checks/suggest-tier.sh", "cached"]);
  expect(result.status).toBe(0);
  expect(result.stdout).toContain("range=cached");
});
