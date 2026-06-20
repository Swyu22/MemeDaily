# 中途回写 Routine（SYNC，跨模型通用）

> Claude Code 用户可用 `/sync` 触发。任务进行中、完成一个小步、或要切换/压缩上下文时做**最小回写**，
> 避免状态只在会话里累积（一旦上下文丢失就失真）。

## 步骤（最小集）
1. 更新 `.cloud.md`：
   - frontmatter.next_actions：移出已完成、加入新发现
   - frontmatter.updated = 当天日期
   - Last Done 增一行（已完成 / 已验证）
2. 若出现新阻塞：写入 frontmatter.blockers 与「Open Questions / Risks」。
3. 若产生关键决策：先在 active session 记一条「决策 / 原因 / 影响」，收工时再决定是否升级为 ADR。
4. **不做**完整收尾仪式（那是 `/close` 的事）。

## 何时用
- 上下文将被压缩 / 要交接 / 要长时间离开 / 刚完成一个 checklist 项。
