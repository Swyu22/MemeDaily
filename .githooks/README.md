# Git Hooks（机械执行层）

> 落实 CONSTITUTION §2「Hook / 自动检查 > Prompt 口头约束」。
> 本目录 hooks 是「被复制进真实项目后」的门禁；本 starter kit 目录本身非 git 仓库。

## 启用方式（在目标项目根目录执行一次）
```bash
git config core.hooksPath .githooks
chmod +x .githooks/*            # macOS / Linux 需要可执行位；Windows+Git Bash 可跳过
```

## 已实现的 hooks
| 文件 | 时机 | 行为 | 门禁强度 |
|------|------|------|----------|
| `pre-commit` | 提交前 | 调 `scripts/checks/*`：状态新鲜度 / 行数 / 关键文件头 / tier 建议 | 状态**硬拦截**，其余**软告警** |
| `commit-msg` | 写提交信息后 | Conventional Commits 校验 | **硬拦截**（merge/revert/fixup 放行） |

调严：给 `pre-commit` 内的行数/头部检查加 `STRICT=1`（如 `STRICT=1 bash scripts/checks/check-file-size.sh staged`）。

## 落地节奏（先告警，后拦截）
**第一批（已实现）**
1. `.cloud.md` 状态新鲜度（pre-commit 硬门禁）
2. 文件行数 > 800 告警
3. 关键文件头说明告警（清单见 `quality/key-files.txt`）
4. Conventional Commits（commit-msg）

**第二批（按需启用）**
- `scripts/checks/check-import-boundaries.sh`（依赖边界，默认关闭，规则见 PROJECT_MAP §依赖规则）
- lint-staged + eslint/tsc/test（接 `quality/eslintrc.complexity.example.json`）

**第三批（按需）**
- 组件库白名单 / 复杂度·嵌套·分支检查 / 架构变更触发 ADR 提示

## 与 CI 的关系
`.github/workflows/ci.yml` 复用同一批 `scripts/checks/*`（`--all` 模式全仓扫描），保证「本地 hook」与「远端 CI」同源同标准。
