---
description: 开工对齐——渐进加载断点状态并输出理解与执行计划
argument-hint: [本次任务一句话（可选）]
---
按 @ai/prompts/UNIFIED_START_PROMPT.md 的协议执行本次开工对齐。

补充（Claude Code 专属）：
- 优先派 **context-loader** 子代理做渐进式上下文加载（按任务类型决定读取范围），让它返回 ≤8 条理解摘要，你再据此与我确认目标/范围/验收。
- 断点状态通常已由 SessionStart hook 注入（来自 `.cloud.md`）。若未注入，先运行 `bash scripts/print-state.sh`。
- 未经我确认执行计划，不要直接改代码。

本次任务（如有）：$ARGUMENTS
