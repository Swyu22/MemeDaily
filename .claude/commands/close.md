---
description: 收尾落盘——按 tier 分级回写 .cloud.md/session/文档并自检
allowed-tools: Bash, Read, Edit, Write
---
按 @ai/prompts/CLOSE_ROUTINE.md 执行收尾落盘。

执行要点：
- 先 `bash scripts/checks/suggest-tier.sh worktree` 取 tier 建议，与 `.cloud.md` frontmatter.tier 核对。
- **严格只做该 tier 要求的回写项**（避免过度仪式）。
- 可派 **session-closer** 子代理起草 Session Summary 与各文件回写内容，你审核后落盘。
- 最后运行 `bash scripts/checks/check-state-fresh.sh` 自检通过。
