/**
 * input: trusted publish/deploy scripts and recovery workflow text
 * output: regression coverage for bounded Pages retries, live-tip fallback dedup, and deploy alerts
 * pos: deterministic reliability contract for unattended and supervised publication paths
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";

const ROOT = process.cwd();
const WORKFLOWS = path.join(ROOT, ".github", "workflows");
const DISPATCH = path.join(ROOT, "scripts", "dispatch-pages.sh");

const GH_MOCK = String.raw`#!/usr/bin/env bash
set -euo pipefail
bump() {
  file="$MOCK_STATE/$1"
  value=0
  if [ -f "$file" ]; then value="$(tr -d '\n' < "$file")"; fi
  value=$((value + 1))
  printf '%s\n' "$value" > "$file"
  printf '%s\n' "$value"
}
if [ "$1" = "run" ] && [ "$2" = "list" ]; then
  if printf '%s\n' "$*" | grep -q 'databaseId,headSha'; then
    if printf '%s\n' "$*" | grep -q -- '--event=push'; then
      count="$(bump push-list)"
      if [ "$count" -eq 1 ]; then exit 75; fi
      if [ "$MOCK_PUSH_RUN" = "present" ]; then printf '201 expected-sha\n'; fi
      if [ "$MOCK_PUSH_RUN" = "failed" ]; then printf '201 expected-sha\n'; fi
      exit 0
    fi
    count="$(bump dispatch-list)"
    if [ "$count" -eq 1 ]; then exit 75; fi
    printf '202 expected-sha\n'
  else
    count="$(bump initial-list)"
    if [ "$count" -lt 3 ]; then exit 75; fi
    printf '101\n'
  fi
  exit 0
fi
if [ "$1" = "workflow" ] && [ "$2" = "run" ]; then
  count="$(bump dispatch)"
  if [ "$count" -eq 1 ]; then exit 75; fi
  exit 0
fi
if [ "$1" = "run" ] && [ "$2" = "view" ]; then
  count="$(bump status)"
  if [ "$count" -eq 1 ]; then exit 75; fi
  if [ "$3" = "201" ] && [ "$MOCK_PUSH_RUN" = "failed" ]; then
    printf 'completed\tfailure\n'
    exit 0
  fi
  if [ "$count" -eq 2 ]; then printf 'in_progress\t\n'; exit 0; fi
  printf 'completed\t%s\n' "$MOCK_CONCLUSION"
  exit 0
fi
printf 'unexpected gh invocation: %s\n' "$*" >&2
exit 2
`;

const GIT_MOCK = String.raw`#!/usr/bin/env bash
set -euo pipefail
if [ "$1" = "fetch" ]; then
  file="$MOCK_STATE/fetch"
  value=0
  if [ -f "$file" ]; then value="$(tr -d '\n' < "$file")"; fi
  value=$((value + 1))
  printf '%s\n' "$value" > "$file"
  if [ "$value" -eq 1 ]; then exit 75; fi
  exit 0
fi
printf 'unexpected git invocation: %s\n' "$*" >&2
exit 2
`;

function writeExecutable(file: string, content: string): void {
  fs.writeFileSync(file, content);
  fs.chmodSync(file, 0o755);
}

function runDispatch(conclusion: string, pushRun = "missing") {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "memedaily-pages-"));
  const bin = path.join(fixture, "bin");
  const state = path.join(fixture, "state");
  fs.mkdirSync(bin);
  fs.mkdirSync(state);
  writeExecutable(path.join(bin, "gh"), GH_MOCK);
  writeExecutable(path.join(bin, "git"), GIT_MOCK);
  writeExecutable(path.join(bin, "sleep"), "#!/usr/bin/env bash\nexit 0\n");
  const result = spawnSync("bash", [DISPATCH, "expected-sha"], {
    cwd: ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH ?? ""}`,
      MOCK_STATE: state,
      MOCK_CONCLUSION: conclusion,
      MOCK_PUSH_RUN: pushRun,
      PAGES_API_ATTEMPTS: "4",
      PAGES_PUSH_POLL_ATTEMPTS: "2",
      PAGES_POLL_ATTEMPTS: "3",
      PAGES_STATUS_ATTEMPTS: "4",
      PAGES_RETRY_BASE_SECONDS: "0",
      PAGES_POLL_DELAY_SECONDS: "0",
      PAGES_STATUS_DELAY_SECONDS: "0",
    },
  });
  const count = (name: string) => {
    const file = path.join(state, name);
    return fs.existsSync(file) ? Number(fs.readFileSync(file, "utf8")) : 0;
  };
  const counts = { initial: count("initial-list"), dispatch: count("dispatch"), fetch: count("fetch") };
  fs.rmSync(fixture, { recursive: true, force: true });
  return { result, counts };
}

it("adopts the push-triggered Pages run without dispatching a duplicate", () => {
  const { result, counts } = runDispatch("success", "present");
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain("successfully deployed expected-sha");
  expect(counts.dispatch).toBe(0);
});

it("retries transient APIs and dispatches recovery when no push run appears", () => {
  const { result, counts } = runDispatch("success");
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain("Watching recovery");
  expect(counts).toEqual({ initial: 3, dispatch: 2, fetch: 3 });
});

it("fails closed when the correlated Pages run fails", () => {
  const { result } = runDispatch("failure");
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("ended failure");
});

it("gives correlated and recovery Pages runs a budget wider than the Pages job maximum", () => {
  const dispatch = fs.readFileSync(DISPATCH, "utf8");
  const pages = fs.readFileSync(path.join(WORKFLOWS, "pages.yml"), "utf8");
  const publisher = fs.readFileSync(path.join(WORKFLOWS, "codex-daily-pr-publish.yml"), "utf8");

  expect(dispatch).toContain('status_attempts="${PAGES_STATUS_ATTEMPTS:-300}"');
  expect(pages).toContain("timeout-minutes: 25");
  expect(pages).toContain("timeout-minutes: 10");
  expect(publisher.split("\n  publish:")[1]).toContain("timeout-minutes: 180");
  for (const name of ["daily-fallback.yml", "daily-news-fallback.yml"]) {
    expect(fs.readFileSync(path.join(WORKFLOWS, name), "utf8")).toContain(
      "timeout-minutes: 180",
    );
  }
});

it.each([
  ["daily-fallback.yml", "npm run fallback:skipped"],
  ["daily-news-fallback.yml", "npm run fallback:skipped:news"],
])("serializes and live-syncs the fail-closed guard in %s", (name, guardCommand) => {
  const workflow = fs.readFileSync(path.join(WORKFLOWS, name), "utf8");
  const sync = workflow.indexOf("Sync to live main before fallback dedup");
  expect(workflow).toContain("group: daily-data-publish");
  expect(workflow).toContain("never creates");
  expect(workflow).toContain("git fetch --quiet origin main");
  expect(workflow).toContain("git reset --hard FETCH_HEAD");
  expect(workflow).toContain("bash scripts/push-main-with-deploy-key.sh");
  expect(sync).toBeGreaterThan(-1);
  expect(workflow.indexOf(guardCommand)).toBeGreaterThan(sync);
});

it.each(["daily-monitor.yml", "daily-news-monitor.yml"])(
  "checks live-main Pages deployment freshness in %s",
  (name) => {
    const workflow = fs.readFileSync(path.join(WORKFLOWS, name), "utf8");
    expect(workflow).toContain("actions: read");
    expect(workflow).toContain("git fetch --quiet --depth=1 origin main");
    expect(workflow).toContain("--workflow=pages.yml --status=success");
    expect(workflow).toContain('.headSha == \\"${LIVE_SHA}\\"');
    expect(workflow).toContain("Pages 部署核验告警");
    expect(workflow).toContain("minimum=3");
    expect(workflow).toContain('[ "$REPORTED" -eq "$VISIBLE" ]');
    expect(workflow).toContain('[ "$VISIBLE" -ge 3 ]');
  },
);
