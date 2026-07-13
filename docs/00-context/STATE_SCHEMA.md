# STATE_SCHEMA — `.cloud.md` frontmatter 字段语义

> 用途：让 **人** 与 **机器（hooks / CI / 子代理）** 对同一份状态达成一致解释。
> `.cloud.md` 顶部的 YAML frontmatter 是「机器可读状态」，下方散文是「人读状态」，二者必须一致。

## 字段表

| 字段 | 类型 | 必填 | 语义 | 校验点 |
|------|------|------|------|--------|
| `goal` | string | ✅ | 当前迭代目标，一句话 | 非空、非占位符 |
| `tier` | enum | ✅ | 本次改动规模：`micro` / `feature` / `milestone`，决定收工回写清单 | 取值合法 |
| `scope_in` | string[] | ✅ | 本次会改的模块/文件 | — |
| `scope_out` | string[] | ➖ | 明确不改的范围（防 scope 蔓延） | — |
| `next_actions` | `{p, do}[]` | ✅ | 下一步动作；`p` ∈ `P0/P1/P2`，`do` 为动作描述 | 至少 1 条 |
| `blockers` | string[] | ➖ | 阻塞项（空数组表示无阻塞） | — |
| `active_session` | string | ✅ | 当前活跃 session 文件路径 `ai/sessions/<file>.md` | 文件存在 |
| `updated` | string | ✅ | 最近回写时间（ISO `YYYY-MM-DD` 或带时分） | 非占位符；不早于最近代码改动 |

## tier 决定回写清单（详见 AI_WORK_CONSTITUTION § 分级回写）

| tier | 触发场景 | 必须回写 |
|------|----------|----------|
| `micro` | 改 1 行 / 配置 / typo | `.cloud.md`(updated) + session 1 行 |
| `feature` | 单模块功能 | 上 + `current-iteration` checklist + Daily session |
| `milestone` | 跨模块 / 接口 / 架构 | 上 + ADR + Milestone summary + README/PROJECT_MAP 同步 |

## 机器消费方
- `scripts/checks/check-state-fresh.sh`：校验 `goal` / `tier` / `updated` / `active_session`，
  并确保状态日期不早于最近非生成数据改动；pre-commit 还要求状态相关改动同时暂存 `.cloud.md`。
- `scripts/checks/suggest-tier.sh`：据 `git diff --stat` 给出 `tier` 建议。
- `.claude/settings.json` 的 `SessionStart` hook：读取并打印 `goal` + `next_actions`。
- `.claude/agents/session-closer.md`：收工时回写本 frontmatter。

## 占位符约定
- 未填写一律写空字符串 `""` 或空数组 `[]`，**不要**保留 `YYYY-MM-DD`、`TODO`、`待填` 等——校验脚本会判定为「未回写」。
