# AGENTS.md — 跨模型协作正典入口（总规则）

> 任何 AI 代理（Claude Code / ChatGPT Codex / 其他）接手本项目，**先读本文，不要直接写代码**。
> 这是工具中立的正典；Claude 专属信息见 `CLAUDE.md`（它通过 `@AGENTS.md` 导入本文）。

## 0. 双层定位（先分清你在哪一层）
- **协作 OS 层（本 kit）**：与技术栈无关，管「怎么协作、怎么不丢上下文、怎么保质量」。
- **应用架构层（项目 `src/`）**：你的产品本身。本 kit **不规定**其结构，只提供「依赖边界校验 + 状态机制」。
- 不要把两层混为一谈。

## 1. 核心原则（最高优先）
1. 文件系统是唯一可靠状态源（SSOT），不靠会话记忆
2. Hook / 自动检查 > Prompt 口头约束
3. 渐进式上下文加载 > 全量灌入
4. 质量标准量化为可判定阈值
5. 计划与进度必须落文件
6. 工具原生能力可用，但不替代项目内状态文件

## 2. 强制读取顺序（不得跳过）
1. `.cloud.md`（当前目标 / 断点 / 下一步——含机器可读 frontmatter，语义见 `docs/00-context/STATE_SCHEMA.md`）
2. 目标模块 `README.md` / `_module.md`（若存在）
3. 目标文件 + 相邻关键文件
4. 复杂 / 跨模块时再读 `docs/00-context/PROJECT_MAP.md`、spec、ADR、plan

## 3. 三条最高禁止
1. 禁止：改了东西不回写 `.cloud.md`
2. 禁止：新增文件不登记到所属模块 README 文件清单
3. 禁止：跨越模块依赖边界乱引用（规则见 `PROJECT_MAP` §依赖规则）

## 4. 标准流程：Start → Plan → Execute → Verify → Sync → Close
- 开工对齐：`ai/prompts/UNIFIED_START_PROMPT.md`（新模型完整交接用 `NEW_MODEL_HANDOFF_PROMPT.md`）
- 中途回写：`ai/prompts/SYNC_ROUTINE.md`（最小回写）
- 收尾落盘：`ai/prompts/CLOSE_ROUTINE.md`——**按 tier 分级**（micro / feature / milestone），避免过度仪式

## 5. 质量红线（机器可校验，详见 CONSTITUTION §6）
单文件 ≤800 行 / 单函数 ≤30 行 / 嵌套 ≤3 / 分支 ≤3；关键文件须有头部说明块（`input/output/pos`）。
超限**不得静默**：说明原因 + 替代方案，记入 ADR 或 session。

## 6. 机械执行层（别只靠口头约束）
- git hooks：`.githooks/`（在项目根 `git config core.hooksPath .githooks` 启用）
- 校验脚本：`scripts/checks/*`（本地 hook 与 CI 同源）
- CI：`.github/workflows/ci.yml`
- 这些是**真门禁**；Hook 失败不得强推。

## 7. 规范入口（按需读取，不要默认全量）
| 用途 | 文件 |
|------|------|
| 完整宪法 | `docs/00-context/AI_WORK_CONSTITUTION.md` |
| 全局地图 / 依赖规则 | `docs/00-context/PROJECT_MAP.md` |
| 状态字段语义 | `docs/00-context/STATE_SCHEMA.md` |
| 当前状态（SSOT） | `.cloud.md` |
| **Codex 接手每日发布（双线，自包含）** | **`ai/prompts/CODEX_FULL_HANDOFF.md`** |
| 每日自动化活规则 | `ai/prompts/MEMEDAILY_DAILY_AUTOMATION.md`（热梗）/ `ai/prompts/DAILYNEWS_DAILY_AUTOMATION.md`（日报） |
| 当前计划 | `docs/20-plan/current-iteration.md` |
| 规格 | `docs/10-spec/` |
| 决策记录 | `docs/30-decisions/` |
| 会话日志 | `ai/sessions/`（一会话一文件 + `INDEX.md`） |

## 8. 工具适配
- **Claude Code**：slash 命令 `/kickoff`（新项目共创）`/start` `/handoff` `/sync` `/close`；子代理 `context-loader` `session-closer`；hooks 见 `.claude/settings.json`。
- **Codex / 其他**：本文即入口；`ai/prompts/*` 作为可复制提示词；`scripts/checks/*` 作为自检。
  - **接手每日发布 → 先读 `ai/prompts/CODEX_FULL_HANDOFF.md`**：这是 Codex 完整接手「每日热梗 +
    每日日报（新闻）」双线的**自包含提示词**，整段复制即可作为 Codex 自动化任务的 prompt——含两条线各自的
    选题研究范围 / 红线 / 输出契约、收集→校验→推送→上线的完整技术管线、与云端自动发布的去重协调、一次性设置。
    其中的「活规则」以 `ai/prompts/MEMEDAILY_DAILY_AUTOMATION.md`（热梗）与
    `ai/prompts/DAILYNEWS_DAILY_AUTOMATION.md`（日报）为准。
