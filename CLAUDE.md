# CLAUDE.md（Claude Code 入口 · 薄指针）

@AGENTS.md

> ☝️ 上方导入的 `AGENTS.md` 是**跨模型正典总规则**（读取顺序、禁止项、流程、质量红线、机械执行层）。
> 本文件只补充 **Claude Code 专属**能力，避免与正典重复。

## Claude Code 专属能力
- **Slash 命令**
  - `/kickoff` — 新项目从零启动（需求共创 → 固化状态文件 → 开工）
  - `/start` — 开工对齐（渐进加载断点 + 输出理解与执行计划）
  - `/handoff` — 新模型/新会话完整交接
  - `/sync` — 中途最小回写
  - `/close` — 收尾落盘（按 tier 分级回写 + 自检）
- **子代理（subagents）**
  - `context-loader` — 按任务类型渐进加载上下文，回 ≤8 条理解摘要
  - `session-closer` — 起草 Session Summary 与各文件回写内容
- **Hooks**（见 `.claude/settings.json`）
  - `SessionStart` — 自动注入 `.cloud.md` 断点状态（goal / next_actions）
  - `Stop` — 检测「改了东西没回写」时提醒运行 `/close`
- **记忆**：长期稳定事实可用 Claude memory；但**项目状态仍以 `.cloud.md` 为准**，memory 不替代 SSOT。

## 强调（与 AGENTS.md 一致）
先读 `.cloud.md` 再动手 → 渐进加载不全量 → 改完必回写（`/close`）→ Hook 失败不强推。
