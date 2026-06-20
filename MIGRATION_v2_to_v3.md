# MIGRATION v2 → v3

## 一句话
把原则从「散文承诺」下沉为「**可执行机制**」，并把「**协作 OS 层**」与「**应用架构层**」分开。

## 新增
- 跨模型入口 `AGENTS.md`（`CLAUDE.md` 改为 `@AGENTS.md` 薄指针）
- 机器可读状态：`.cloud.md` 顶部 frontmatter + `docs/00-context/STATE_SCHEMA.md`
- 真执行层：`scripts/checks/*`、`scripts/print-state.sh`、`.githooks/{pre-commit,commit-msg}`、`.claude/settings.json`(hooks)、`.github/workflows/ci.yml`
- 原生入口：`.claude/commands/{start,handoff,close,sync}.md`、`.claude/agents/{context-loader,session-closer}.md`
- 正典 routine：`ai/prompts/{CLOSE_ROUTINE,SYNC_ROUTINE}.md`
- 分级仪式：CONSTITUTION §5.5（micro / feature / milestone）
- 补缺层：`docs/10-spec/spec-template.md`；会话改「一会话一文件」+ `ai/sessions/INDEX.md`；计划支持并行 stream（`docs/20-plan/_stream-template.md`）
- 依赖边界（opt-in）：PROJECT_MAP §依赖规则 + `scripts/checks/check-import-boundaries.sh` + `quality/{key-files.txt,import-boundaries.example.txt,eslintrc.complexity.example.json}`

## 变更
- `CLAUDE.md`：瘦身为薄指针
- `AI_WORK_CONSTITUTION.md`：加 §5.5 分级回写；§8 Sync 改分级
- `PROJECT_MAP.md`：加「依赖规则」段
- `.githooks/README.md`：改为启用指南
- `.cloud.md` / `current-iteration.md`：加机器可读 / 并行指针结构

## 移除
- `.githooks/pre-commit.example.sh`（被真 `pre-commit` 取代）
- `ai/sessions/YYYY-MM-DD.template.md`（被 `_session-template.md`「一会话一文件」取代）

## 启用步骤（目标项目）
1. `git config core.hooksPath .githooks && chmod +x .githooks/* scripts/checks/* scripts/*.sh`
2. 填 `.cloud.md` frontmatter 与 `PROJECT_MAP`
3. Claude Code 用 `/start`；其他模型读 `AGENTS.md`
4. 收工 `/close`（按 tier）

## 兼容性
- 纯文档 + bash + 配置，无运行时依赖；CI 探测到 `package.json` 才跑前端检查。
- 非 git 仓库时 hooks/CI 静默跳过相关检查（复制进真实项目并 `git init` 后生效）。
