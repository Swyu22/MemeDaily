# Git Hooks（机械执行层）

> 落实 CONSTITUTION §2「Hook / 自动检查 > Prompt 口头约束」。
> 本目录是 MemeDaily 仓库当前启用的本地机械门禁，不是未落地的 starter kit 示例。

## 启用方式（在目标项目根目录执行一次）
```bash
git config core.hooksPath .githooks
chmod +x .githooks/*            # macOS / Linux 需要可执行位；Windows+Git Bash 可跳过
```

## 已实现的 hooks
| 文件 | 时机 | 行为 | 门禁强度 |
|------|------|------|----------|
| `pre-commit` | 提交前 | 调 `scripts/checks/*`：状态新鲜度 / 文件上限 / 关键文件头 / secrets / 依赖边界 / tier 建议 | 状态、文件上限、关键头、secrets、依赖边界均**硬拦截** |
| `commit-msg` | 写提交信息后 | Conventional Commits 校验 | **硬拦截**（merge/revert/fixup 放行） |

文件上限和关键头检查已固定以 `STRICT=1` 执行；不要在本地降级后提交。

## 落地节奏（先告警，后拦截）
**第一批（已实现）**
1. `.cloud.md` 状态新鲜度（pre-commit 硬门禁）
2. 第一方源代码 / 脚本 / 工作流文件行数 > 800 硬拦截
3. 关键文件头说明硬拦截（清单见 `quality/key-files.txt`，缺失文件同样失败）
4. Conventional Commits（commit-msg）
5. 已知 secret 模式和模块依赖边界硬拦截

**第二批（CI 执行）**
- ESLint、TypeScript、Vitest、两条数据验证和 Next.js 静态构建
- advisory complexity report（超限例外见 ADR-004 / ADR-005）

**保留为人工审查**
- 架构变更触发 ADR、复杂度例外合理性、内容语义安全和外部 secret 轮换

## 与 CI 的关系
`.github/workflows/ci.yml` 复用同一批 `scripts/checks/*`（`--all` 模式全仓扫描），保证「本地 hook」与「远端 CI」同源同标准。
