# 1. Skills 识别结果

## 已安装 Skills

- 运行时暴露的 Skill roots 共发现 790 个物理 `SKILL.md`；按 frontmatter `name`
  去重后为 524 个正典 Skill。插件前缀和软链接会让同一套指令出现多个运行时别名。
- 逐项名称、用途、适用性和判断理由见
  [`2026-07-13-skills-inventory.md`](./2026-07-13-skills-inventory.md)。该清单是本节的
  完整明细，不以抽样代替全量盘点。
- 最终分类：23 个实际使用，26 个与已选 Skill 重叠并由更具体的检查覆盖，475 个因技术栈、
  产物类型或任务触发条件不匹配而不适用。

## 本次实际使用的 Skills

| Skill | 本项目用途 | 适用结论 |
| --- | --- | --- |
| `accessibility` | WCAG、键盘、标签、焦点、对比度与 live region | 适用并执行 |
| `agentic-actions-auditor` | 审核公开网页文本进入 AI Action 后的凭据与写入边界 | 适用并执行 |
| `agents-md` | 核对正典入口、状态回写、模块文件登记和代理约束 | 适用并执行 |
| `code-review` | 缺陷优先、文件级、按严重度审查 | 适用并执行 |
| `commit` | 通过门禁后生成可审阅的 conventional commit | 适用并执行 |
| `documentation` | 同步 state、spec、plan、ADR、prompt、session 与 README | 适用并执行 |
| `find-bugs` | 搜索潜在回归、错误分支、死代码与失效配置 | 适用并执行 |
| `gh-cli` | 使用已认证 GitHub CLI 核对仓库、workflow、Pages 和部署 | 适用并执行 |
| `gha-security-review` | 权限、token、事件、超时和 Action SHA pinning | 适用并执行 |
| `next-best-practices` | App Router、静态导出、metadata、route 与 client/server 边界 | 适用并执行 |
| `playwright-best-practices` | 桌面/移动、键盘、详情路由、控制台和离线验收 | 适用并执行 |
| `property-based-testing` | 用跨时间和跨候选不变量设计回归样本 | 适用并执行 |
| `pwa-expert` | manifest、scope、Service Worker、缓存与离线页 | 适用并执行 |
| `react-best-practices` | 状态归属、渲染、组件职责与死分支 | 适用并执行 |
| `react-doctor` | 独立扫描 React 改动并逐条判定真问题/误报 | 适用并执行 |
| `security-review` | 密钥、URL、内容信任、prompt injection 与最小权限 | 适用并执行 |
| `supply-chain-risk-auditor` | lockfile、依赖健康、Action 来源和漏洞状态 | 适用并执行 |
| `typescript-pro` | schema 派生类型、严格编译、时间归一化与无效导出 | 适用并执行 |
| `vercel-composition-patterns` | 移除无用布尔渲染模式，保持组件责任清晰 | 适用并执行 |
| `verification-before-completion` | 新鲜运行门禁并保留可复核证据 | 适用并执行 |
| `vitest` | 域规则、时间戳、workflow 和 staged-index 集成测试 | 适用并执行 |
| `web-design-guidelines` | 间距、溢出、控件语义、响应式和品牌布局 | 适用并执行 |
| `web-perf` | 字体、关键路径、缓存和 Lighthouse 指标 | 适用并执行 |

## 不适用 Skills 及原因

- 完整 475 项及逐项原因位于 Skills inventory。主要不适用族群为：原生/Expo、区块链、
  C/C++/Rust fuzzing、Cloudflare/ECS/backend、数据库/认证、Figma/视频/文档制品、营销增长、
  Vue/Tailwind/HyperFrames，以及本轮未触发的 PR/issue/release/inbox 工作流。
- 26 个 `Applicable (covered)` Skill 与上表存在同一检查面，例如 `playwright` 与
  `playwright-best-practices`、`react-expert` 与 `react-best-practices`。为避免冲突与重复程序，
  由更具体的已用 Skill 执行，但其关注点仍进入检查清单。
- 未虚构或安装新 Skill。`shellcheck`、`actionlint`、`semgrep`、`codeql` 和 Chrome DevTools
  MCP 在本机不可调用，因此不能把对应 CLI 扫描伪装成已运行；替代证据与剩余限制见第 6、7 节。

# 2. 项目扫描结果

## 目录/模块概览

- 扫描候选共 297 个当前项目文件：`src/` 25、`scripts/` 21、`data/` 38、`.github/` 12、
  `.claude/` 9、`.githooks/` 3、`ai/` 15、`docs/` 29、`quality/` 4、`public/` 124，另含
  14 个根目录配置/说明文件。
- `public/` 中包括 110 个 WOFF2 字体、9 个 PNG、1 个 ICO、manifest、Service Worker、离线页和
  字体 CSS。二进制文件按格式签名、尺寸、哈希/引用和孤儿关系检查，不做无意义的逐字节代码审阅。
- 源码覆盖 Next.js App Router、React client components、memedaily/dailynews 两套 domain、Zod
  schema、静态数据加载和全部现有测试。
- 自动化覆盖 11 个 GitHub Actions workflow、pre-commit、5 个机械检查、发布/兜底/监控/探针、
  字体生成与 Pages dispatch。

## 关键入口文件

- 应用：`src/app/layout.tsx`、`src/app/page.tsx`、`src/app/archive/page.tsx`、
  `src/app/meme/[id]/page.tsx`、`src/features/home/HomeTabs.tsx`。
- 数据契约：`src/domain/memedaily/schema.ts`、`src/domain/memedaily/rules.ts`、
  `src/domain/dailynews/schema.ts`、`src/domain/dailynews/rules.ts`。
- 构建/依赖：`package.json`、`package-lock.json`、`next.config.mjs`、`tsconfig.json`、
  `eslint.config.mjs`、`eslint.complexity.config.mjs`。
- 部署：`.github/workflows/*.yml`、`scripts/dispatch-pages.sh`、`public/CNAME`、
  `public/manifest.webmanifest`、`public/sw.js`。
- 协作正典：`AGENTS.md`、`.cloud.md`、`docs/00-context/`、`docs/10-spec/`、
  `docs/20-plan/`、`docs/30-decisions/`、`ai/prompts/`、`ai/sessions/`。

## 文件类型覆盖情况

- 覆盖 Markdown、TypeScript/TSX、JavaScript/MJS、CSS、JSON、YAML、Shell、Python、HTML、
  manifest、TXT 规则表和图标/字体资源。
- `package-lock.json` 检查 registry/integrity、git dependency 和已安装依赖树；`npm audit`
  检查已知漏洞。
- 每个 daily JSON 均由 schema + domain gate 校验；另做历史时间不变量与可见安全词复核。

## 审查边界说明

- `.git/`、`node_modules/`、`.next/` 和 `out/` 是生成/缓存目录，不进入源文件逐行审查；
  `out/` 仍用于 162 条详情路由存在性、124 个静态页面、浏览器与 Lighthouse 验收。
- 只修改当前仓库。GitHub/生产只读取本仓库的远端状态；不改阿里云账户、DNS 或其他项目。
- 历史来源真实抓取时刻不可重建；只修正违反发布上界的值，不编造更精确时间。

# 3. 审查计划

| 优先级 | 模块 | 核心审查对象 |
| --- | --- | --- |
| P0 | 发布安全 | AI Action token、OIDC、allowed tools、写路径、trusted publish job |
| P0 | 内容/时间完整性 | 安全红线、published 可见性、证据门槛、generated/published/captured 顺序 |
| P0 | 机械门禁 | staged bytes、密钥、文件行数、关键头、依赖边界、`.cloud.md` 新鲜度 |
| P0 | 部署 | canonical gate、workflow dispatch 关联、成功 conclusion、Pages/HTTPS/路由 |
| P1 | UI/PWA | 桌面/移动、详情、信源、键盘、对比度、manifest、SW、离线与缓存 |
| P1 | 构建/类型/依赖 | Next/React/TS/Zod、死代码、Action/包供应链、可复现构建 |
| P1 | 文档/协作 | 正典一致性、模块登记、ADR、prompt、plan、session、历史说明 |
| P2 | 性能/维护性 | 字体关键路径、包体、复杂度例外、工具误报与长期残余风险 |

高风险区域是公开网页文本进入模型后的凭据边界、自动提交权限、灾害/隐私/未成年人内容、
时间戳可信来源、staged/worktree 差异，以及 GitHub Pages 根路径/子路径和边缘缓存行为。

# 4. 问题清单

| 编号 | 文件路径 | 问题描述 | 类别 | 严重程度 | 对应 Skill / 规范 | 是否已修复 |
| --- | --- | --- | --- | --- | --- | --- |
| F-01 | `.github/workflows/daily-publish.yml`, `daily-news-publish.yml` | 模型 job 可用 OIDC 换取独立 App token，且工具路径/写权限过宽 | Agent/GHA 安全 | 高 | agentic-actions-auditor, gha-security-review | 是 |
| F-02 | `scripts/checks/*.sh`, `.githooks/pre-commit` | staged 门禁枚举 index，却读取 worktree，可用未暂存安全版本绕过 | 门禁完整性 | 高 | security-review, find-bugs | 是 |
| F-03 | `src/domain/memedaily/rules.ts`, `data/daily/*.json` | 历史可见内容含灾害、隐私、侮辱等高信号风险，规则未硬阻断 | 内容安全 | 高 | security-review, property-based-testing | 是 |
| F-04 | 两套 domain rules、daily JSON、发布 workflow | 生成/来源时间晚于发布时间，模型时间被误当可信发布时钟 | 数据完整性 | 高 | analyze-data-quality, typescript-pro | 是 |
| F-05 | 外部阿里云账户 | 会话中曾公开且后续重新启用的 AccessKey 已失去保密性 | 凭据 | 高 | security-review | 否，需账户操作 |
| F-06 | `.github/workflows/*.yml` | 官方 Actions 使用可变 tag，供应链可被 tag 移动影响 | 供应链 | 中 | supply-chain-risk-auditor | 是 |
| F-07 | workflow 与 fallback 脚本 | Pages 只判断触发/部分校验，未确认对应 SHA 的成功 run，fallback 有竞争窗口 | 部署可靠性 | 中 | gha-security-review, verification-before-completion | 是 |
| F-08 | `public/sw.js`, `manifest.webmanifest` | cache 清理过宽、缺离线页、manifest `id` 固定根路径 | PWA | 中 | pwa-expert | 是 |
| F-09 | `public/fonts/`, `scripts/fetch-fonts.sh`, `layout.tsx` | 434 font-face、阻塞加载、生成脚本非事务且上游文件名可变 | 性能/供应链 | 中 | web-perf, supply-chain-risk-auditor | 是 |
| F-10 | `HomeTabs.tsx`, `ArchiveClient.tsx`, CSS/layout | tabs 键盘/ARIA、表单标签、焦点、对比度、品牌重复 accessible name 不完整 | 可访问性/UI | 中 | accessibility, web-design-guidelines | 是 |
| F-11 | `quality/*`, checks、ESLint | 文件/头部/state/import 边界的文档约束与真实硬门禁不一致 | 架构治理 | 中 | agents-md, security-review | 是 |
| F-12 | `.cloud.md`, map/spec/plan/prompt/session/README | 单线旧架构、旧 fallback、占位 shell 和状态断点过时 | 文档一致性 | 中 | documentation, agents-md | 是 |
| F-13 | GitHub Pages 托管边界 | 边缘 HTML TTL 与旧 hashed chunk 清除之间仍可能短时错配 | 托管限制 | 中 | pwa-expert, web-perf | 否，架构残余 |
| F-14 | `src/domain/*/schema.ts` | 使用 Zod 4 已弃用链式 URL/datetime API | API 维护 | 低 | typescript-pro | 是 |
| F-15 | data/labels/components | 未使用导出和已失效 compact rendering 分支增加维护面 | 死代码 | 低 | find-bugs, vercel-composition-patterns | 是 |
| F-16 | `.github/workflows/cloud-fetch-check.yml` | `/tmp/body` 可沿用旧响应，状态码与 body 可能不属于同次探针 | 监控正确性 | 低 | find-bugs | 是 |
| F-17 | `public/sw.js` | Cache Storage 写失败可能丢弃本已成功的网络响应 | 稳定性 | 低 | pwa-expert | 是 |
| F-18 | `scripts/fetch-fonts.sh` | 字体下载未校验 WOFF2 签名/内容哈希，失败会破坏现有 bundle | 供应链/构建 | 低 | supply-chain-risk-auditor | 是 |
| F-19 | 17 个 TS/TSX 文件 | advisory complexity 有 38 条阈值例外 | 维护性 | 低 | code-review | 接受并登记 ADR |
| F-20 | 本地工具环境 | Chrome DevTools MCP、CodeQL/Semgrep/ShellCheck/Actionlint 不可用 | 验证覆盖 | 低 | web-perf, security-review | 替代验收，仍有残余 |
| F-21 | `CODEX_FULL_HANDOFF.md` | 本地 Codex prompt 约束不能形成 OS 级沙箱 | Agent 安全 | 低 | agentic-actions-auditor | 文档澄清，机制未提供 |
| F-22 | 历史 daily JSON | 原始精确 `captured_at` 无审计日志可恢复 | 数据溯源 | 低 | analyze-data-quality | 上界修复，精度不可恢复 |
| F-23 | `HomeTabs.tsx`, `layout.tsx` | React Doctor 把事件函数误报为 updater，并反对主/无脚本两处有意的同源字体 link | 工具诊断 | 低 | react-doctor | 已逐项判为误报/例外 |
| F-24 | `layout.tsx` | 字体 CSS preload 且 DOMContentLoaded 立即启用，慢速移动模拟性能 56 | Web 性能 | 中 | web-perf, react-best-practices | 是，提升至 78 |
| F-25 | `scripts/checks/suggest-tier.sh` | 空暂存区时未加花括号的变量紧邻全角括号，被 Bash 解析成未定义变量 | Shell 稳定性 | 低 | find-bugs, verification-before-completion | 是 |
| F-26 | `.github/workflows/*.yml` | 旧版官方 JavaScript Actions 仍声明 Node 20，runner 仅以强制兼容模式运行 | 供应链维护 | 中 | supply-chain-risk-auditor, gha-security-review | 是 |

# 5. 修复记录

| 编号 | 修改文件 | 修复内容与依据 | 影响范围 | 风险说明 |
| --- | --- | --- | --- | --- |
| R-01 | 两个 publish workflow、ADR-006 | 模型 job 显式使用只读 `github.token`，移除 OIDC，限定 Read/Glob/Grep 与单一 JSON Write/Edit；trusted job 才持写 token | 每日双线发布 | 若 Action 上游接口变化会 fail closed，不会静默放权 |
| R-02 | checks、pre-commit、`checks.test.ts` | staged 模式统一通过 `git show :path` 读取 index，并为 5 类绕过建立隔离 git fixture | 本地提交与 CI | 严格模式会阻止历史上可侥幸提交的错误 |
| R-03 | meme rules/tests、9 个历史日期 | 新增高信号安全 buckets；11 个危险记录改为不可见并修正 accounting | 热梗可见内容 | 词表保守，语义风险仍需模型判断 |
| R-04 | 两套 rules、`stamp-publish-time.ts`、workflow、历史 JSON | trusted job 在校验前盖发布时钟；未来来源时间直接拒绝；历史不可能值仅夹到发布上界 | 双线数据契约 | 历史原始精确时刻不可恢复 |
| R-05 | 11 个 workflow、workflow security test | 所有外部 Action 固定完整 commit SHA，校验无 tag/main/master | 全部 CI/CD | 升级需显式审核新 SHA |
| R-06 | `dispatch-pages.sh`、publish/fallback/pages workflow | canonical `npm run check`；记录触发前 run IDs，只接受新建、对应 SHA 且 conclusion=success 的 Pages run | 自动发布 | GitHub Actions API 暂时不可用时发布明确失败 |
| R-07 | manifest、SW、`offline.html`、public README | scope 相对化、移除根路径 id、只清本应用旧 cache、增加离线 fallback 和安全 cache 写 | PWA 根域/子路径 | 自定义域移除时仍须人工处理 `CNAME` |
| R-08 | fonts CSS、compactor、fetch script、layout | 434 降至 110 font-face；事务下载、签名/哈希/孤儿校验；字体改首屏后空闲加载 | 字体与首屏 | 富中文页面仍会命中约 1.7MB 字体分片 |
| R-09 | HomeTabs/Archive/layout/CSS | roving tab、方向键、ARIA、label/name/type、live result、skip link、focus、对比度、移动换行和品牌无重复名称 | 全站 UI | 无业务逻辑变化 |
| R-10 | quality、checks、ESLint、AGENTS | file/header/state/import 规则设 strict；alias/relative 跨域同时拦截；generated daily-only 例外写入正典 | 架构与协作 | 新模块必须登记边界和 key header |
| R-11 | state/map/spec/plan/ADR/prompt/session/README | 更新双线架构、trusted boundary、定时规则、fallback 弃用提示和当前断点 | 后续模型交接 | 历史产品文档保留并加现状提示 |
| R-12 | schema/data/labels/components | 改用 `z.url()`/`z.iso.datetime()`；删无用导出和 compact 分支 | 类型与维护 | 无 schema 语义放宽 |
| R-13 | cloud fetch workflow | 每次探针独立 temp body，并将状态/body 绑定同次请求 | 生产监控 | 仍依赖 GitHub runner 网络 |
| R-14 | SW | cache put 失败时继续返回有效网络响应，后台字体写入由 event 生命周期托管 | 弱网/隐私模式 | quota 满时只失去缓存，不失去在线内容 |
| R-15 | page/rules/SW 小循环 | 用 `flatMap`/预编译 regex 消除低价值重复迭代 | 运行与可读性 | 保持结果顺序与语义 |
| R-16 | domain/workflow/check/timestamp tests | 测试总数扩到 80，覆盖安全词、时间不变量、token 边界、Action pin 和 staged bypass | 回归保护 | 浏览器脚本当前为验收命令，尚未纳入 CI |
| R-17 | `layout.tsx` | 删除字体 CSS preload，不在 DOMContentLoaded 启用，改 window load 后 idle 调度 | Web 性能 | 首屏先用系统 CJK，随后 swap 到自托管字体 |
| R-18 | `suggest-tier.sh`, `checks.test.ts` | 用 `${RANGE}` 明确变量边界，并增加空 staged diff 回归测试 | 提交 tier 提示 | advisory 脚本仍不阻断硬门禁 |
| R-19 | 11 个 workflow、workflow security test | 将 7 个官方 Action 升到已核对的 Node 24 主版本发布 commit，并锁定精确 SHA | 全部 CI/CD | major 升级需由远端 CI/Pages 复证输入输出兼容性 |

# 6. 验收结果

| 验收编号 | 验收对象 | 验收标准 | 验收方法 | 验收结论 | 是否通过 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| A-01 | R-01 Agent 边界 | 模型无 OIDC/shell/广域写；trusted job 才可发布 | `workflow-security.test.ts`、YAML 解析、权限静态检索 | token/工具/路径均符合最小权限 | 是 | Anthropic Action 必需 token 仅传给 Action，不暴露给模型工具 |
| A-02 | R-02 staged 门禁 | index 与 worktree 不一致时仍能拦截 | 5 个隔离 git fixture 集成测试 | secret/801 行/缺头/非法 state/alias import 均被拦截 | 是 | 16 项审计专项测试包含此组 |
| A-03 | R-03 内容安全 | 可见内容不命中高信号红线 | domain 单测、24 日 validator、全历史可见文本扫描 | 0 条可见违规；11 条历史记录隐藏 | 是 | 纯比喻“塌房”样本不误杀 |
| A-04 | R-04 时间完整性 | generated/source 不晚于 published | 双 domain 单测、38 日 JSON 全量脚本 | envelope 0 违规，source 0 违规 | 是 | 当前流程对未来来源 fail closed |
| A-05 | R-05 Action pin | 不存在 tag/main/master ref | workflow test + `rg` | 11 个 workflow 全为 40 位 SHA | 是 | SHA 来源逐项核对官方仓库 |
| A-06 | R-06 部署关联 | 只把对应提交的成功 Pages run 当作成功 | dispatch 脚本静态/单测、workflow canonical gate 检查 | 触发前后 run 隔离与 success conclusion 已实现 | 是 | 生产实跑见 A-18 |
| A-07 | R-07 PWA | 根域/子路径可解析，离线导航有 fallback | manifest URL 双基址解析 + Playwright 离线未缓存路由 | scope/start/icons 正确；离线返回 200 | 是 | manifest 不再固定 `id` |
| A-08 | R-08 字体 | 无缺失/孤儿/坏签名，CSS 非阻塞 | 110 URL/文件/`wOF2` 签名脚本、浏览器 media 切换 | 110/110 完整；CSS 114,306 bytes | 是 | 原 CSS 约 452KB/434 faces |
| A-09 | R-09 可访问性/UI | 桌面/390px 无重叠溢出，键盘/标签可用 | Playwright + Lighthouse | console 0；Lighthouse accessibility 100 | 是 | source links、品牌和 tab 均通过 |
| A-10 | R-10 机械治理 | all 模式 strict 为 0 warning | 5 个 checks 逐个运行 | secret/file/header/import/state 全通过 | 是 | pre-commit 还会在 staged candidate 再跑 |
| A-11 | R-11 文档状态 | 正典无旧断点，新增文件均登记 | README 清单、state gate、全文检索 | 当前双线/边界/风险一致 | 是 | `.cloud.md` 收尾时再写最终 SHA/生产状态 |
| A-12 | R-12 类型/死代码 | lint/typecheck/build 无回归 | `npm run check` | ESLint 0 warning、TS 通过、124 页构建 | 是 | Zod deprecated API 已移除 |
| A-13 | 详情与信源 | 所有 published ID 有静态详情；首页卡至少 2 信源 | out 文件全量检查 + Playwright | 162/162 路由存在；可见卡片字段/信源齐全 | 是 | “查看档案”实测 HTTP 200 |
| A-14 | 供应链 | 无已知 npm 漏洞，依赖树可解析 | `npm audit --audit-level=low`、`npm ls --all` | 0 vulnerabilities；依赖树退出码 0 | 是 | optional 跨平台包未安装属预期 |
| A-15 | R-17 Web 性能 | 不牺牲自托管字体的前提下缩短关键首屏 | 前后两次 Lighthouse mobile | performance 56→78，FCP 10.8s→1.8s，a11y/best-practices 100 | 是 | 本地 HTTP/1.0 无压缩，LCP 5.6s 仍列残余 |
| A-16 | 全量项目门禁 | 数据、lint、types、tests、build 全绿 | 新鲜 `npm run check` | 24 meme + 14 news、80 tests、124 pages 全通过 | 是 | 最终 staged candidate 将再跑一次 |
| A-17 | 复杂度例外 | 例外数量稳定且有 ADR | `npm run lint:complexity` + ADR-005 | 38 warning、0 error，与 ADR 一致 | 是（例外） | 17 个文件，保持 advisory |
| A-18 | 远端/生产 | 审计提交在远端且 Pages success，HTTPS/路由/隐藏内容正确 | `gh` workflow/Pages + `curl` + Playwright | SHA `1c04ed8` / run `29250003804` 成功；apex/www/详情/manifest/offline 200，11 个隐藏路由 404，console 0 | 是 | 分支 deploy 被环境保护正确拒绝，main deploy 成功 |
| A-19 | R-18 空 diff | advisory tier 在无改动时正常退出 | Vitest fixture + 真实 amend hook | 输出 `range=cached`，退出码 0 | 是 | 修复由提交后空 index 路径发现 |
| A-20 | R-19 Node 24 Actions | 7 个官方 Action 使用已核对的 Node 24 release SHA | GitHub API action.yml/commit + workflow test + YAML | 本地 pin/runtime/语法通过；远端 closeout Pages 待合并后复证 | 待执行 | 不使用可变 tag |

# 7. 未完成项 / 需人工确认项

| 文件路径/边界 | 问题 | 原因 | 建议下一步 |
| --- | --- | --- | --- |
| 外部阿里云 RAM | 已公开且重新启用的 AccessKey 不再可信 | 仓库扫描不能撤销云账户凭据 | 立即禁用/删除并新建最小权限 key；不要再发到聊天或仓库 |
| GitHub Actions 定时环境 | 新权限边界下首次 06:00/07:00 真正模型运行尚未发生 | 只能等下一次 schedule 事件 | 观察两个 publish workflow；失败时读取 artifact，不放宽模型权限 |
| 历史 daily JSON | 精确原始来源捕获时刻不可恢复 | 旧流程没有可信审计日志 | 保留当前“不得晚于发布”的上界修复，不编造精确值 |
| 历史内容语义 | 词表无法识别所有政治、隐私、争议或讽刺上下文 | 确定性过滤不是语义证明 | 定期做人工/模型语义复核，发现后置 `published:false` 并留审计标记 |
| GitHub Pages edge | 旧 HTML 与已清除 chunk 仍可能短时错配 | Pages 不开放自定义 Cache-Control/边缘失效策略 | 若频繁发生，迁移到可控缓存托管或保留 N-1 hashed assets |
| `public/fonts/` | 富中文首页仍命中约 27 个分片、约 1.7MB | 用户要求 Noto Sans SC 全站自托管，长首页字符覆盖广 | 产品确认后可缩短首页天数、做站点字集子集或接受系统 CJK |
| 本地工具链 | CodeQL/Semgrep/ShellCheck/Actionlint/Chrome DevTools MCP 缺失 | 当前环境没有对应可执行工具 | CI 可另增 CodeQL；深度 CWV 用真实生产 Chrome trace 复核 |
| 本地 Codex fallback | prompt 不能等同 OS 沙箱 | Codex App 外部自动化配置不在仓库可证明边界内 | 仅作为有人监督恢复路径；无人值守继续使用已收紧云端 workflow |
| React Doctor | 3 条 state-updater 误报、2 条同源字体 link 架构例外 | 规则把普通事件 helper 识别为 updater，并偏好 bundle CSS | 保留证据，不为清零扭曲事件代码或取消自托管字体 |
| SEO | Lighthouse SEO 63 | 产品明确设置 `noindex,nofollow`，不可爬行项是需求 | 维持 noindex；若转公开增长产品再单独变更产品决策 |

# 8. 最终结论

- **项目整体规范符合度：** 本地代码、数据、自动化、PWA、文档与机械门禁约 92%。核心高风险
  仓库问题均已修复；外部已泄露 AccessKey 是唯一未完成的高风险项。
- **本轮修复完成度：** 26 项发现中 21 项完成代码/数据/文档修复，2 项完成可验证的风险澄清或
  上界修复，3 项属于外部账户、托管机制或工具环境残余。可自动修复项完成度约 95%。
- **当前剩余风险：** 外部 key、首次定时 workflow、历史语义安全、Pages edge TTL、长中文页字体
  负载与本地静态分析工具缺口。均已给出责任边界和下一步，不影响当前静态站点构建。
- **建议下一步动作：** 先轮换 Aliyun key；随后观察首次双线定时任务；若生产 LCP 持续偏高，
  再基于真实用户/生产 trace 决定首页天数或字体子集，而不是继续凭本地模拟猜测优化。
