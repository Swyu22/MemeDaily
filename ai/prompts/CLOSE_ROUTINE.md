# 收尾落盘 Routine（CLOSE，跨模型通用）

> Claude Code 用户可用 `/close` 触发；其他模型直接按本文执行。
> 目标：收工时把「会话记忆」固化进「文件系统 SSOT」，并**按改动规模分级**，避免过度仪式。

## 第一步：判定 tier
- 读 `.cloud.md` frontmatter.tier；不确定就运行 `bash scripts/checks/suggest-tier.sh worktree` 取建议。
- tier ∈ `micro` | `feature` | `milestone`（定义见 AI_WORK_CONSTITUTION §分级回写）。

## 第二步：按 tier 回写（只做该级要求，不多不少）
### micro（改 1 行 / 配置 / typo）
- [ ] `.cloud.md`：frontmatter.updated + Last Done 一行
- [ ] active session 追加一行

### feature（单模块功能）= micro + 
- [ ] `docs/20-plan/current-iteration.md` checklist 勾选
- [ ] session 写 Daily Summary（Last Done / Next Actions / Key Decisions）

### milestone（跨模块 / 接口 / 架构）= feature + 
- [ ] 关键文件头说明（若职责/依赖/输出变化）
- [ ] 模块 README（若结构/职责变化）
- [ ] `docs/00-context/PROJECT_MAP.md`（若架构/边界变化）
- [ ] 新增 ADR 到 `docs/30-decisions/`（若有关键决策）
- [ ] session 写 Milestone Summary
- [ ] 更新 `ai/sessions/INDEX.md`

## 第三步：机械自检
- [ ] `bash scripts/checks/check-state-fresh.sh`
- [ ] `bash scripts/checks/check-file-size.sh staged`（若已 add）
- [ ] 构建 / 测试 / lint（若项目有）

## 第四步：对齐 frontmatter
把 `.cloud.md` 顶部 `goal / tier / scope_* / next_actions / blockers / active_session / updated` 全部对齐到最新真实状态；`updated` 写**当天日期**。

## 第五步（可选）：提交
建议 Conventional Commits（`commit-msg` hook 会校验）。
