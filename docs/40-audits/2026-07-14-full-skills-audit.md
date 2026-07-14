# 1. Skills 识别结果

## 已安装 Skills

- 当前运行时发现 789 个物理 `SKILL.md`；按 frontmatter `name` 与运行时别名去重后，正典名称仍为
  524 个。和 2026-07-13 相比仅插件缓存物理路径数发生变化，正典集合与适用性分类未变。
- 524 个 Skill 的**逐项名称、用途、是否适用、判断原因**见
  [`2026-07-13-skills-inventory.md`](./2026-07-13-skills-inventory.md)。本轮重新核对该清单与当前
  runtime 暴露项，不以抽样替代全量盘点。
- 分类：23 个实际使用；26 个适用但被更具体 Skill 覆盖；475 个因技术栈、产物类型或任务触发条件
  不匹配而不适用。

## 本次实际使用的 Skills

| Skill | 用途 | 适用结论 |
| --- | --- | --- |
| `accessibility` | WCAG、键盘、live region、表单与控件语义 | 适用并执行 |
| `agentic-actions-auditor` | AI Action 的输入、工具、token 与写入边界 | 适用并执行 |
| `agents-md` | AGENTS 正典、状态、模块登记和交接约束 | 适用并执行 |
| `code-review` | 缺陷优先、按严重度、文件级审查 | 适用并执行 |
| `commit` | 分支、门禁、Conventional Commit 与可审阅交付 | 适用并执行 |
| `documentation` | state、plan、ADR、prompt、session、README 一致性 | 适用并执行 |
| `find-bugs` | 时序、竞态、错误状态、死配置与异常分支 | 适用并执行 |
| `gh-cli` | 远端、PR、workflow、Pages 与生产核对 | 适用并执行 |
| `gha-security-review` | workflow 权限、凭据时长、SHA pin 与并发行为 | 适用并执行 |
| `next-best-practices` | App Router、静态导出、Link 预取与 server/client 边界 | 适用并执行 |
| `playwright-best-practices` | 桌面/移动/暗色、键盘、详情、归档与错误监听 | 适用并执行 |
| `property-based-testing` | 最新运行、证据、时间和跨日不变量 | 适用并执行 |
| `pwa-expert` | manifest、SW、离线壳、启动表面与安装态 | 适用并执行 |
| `react-best-practices` | 状态来源、事件副作用、组件职责与渲染边界 | 适用并执行 |
| `react-doctor` | 改动范围独立扫描与误报复核 | 适用并执行 |
| `security-review` | 密钥、URL、公开输入、最小权限与 fail-closed | 适用并执行 |
| `supply-chain-risk-auditor` | lockfile、npm、安装脚本、Action 来源与 integrity | 适用并执行 |
| `typescript-pro` | Zod 契约、派生类型、严格编译与可空状态 | 适用并执行 |
| `vercel-composition-patterns` | 共享状态计算与小型无状态视图组合 | 适用并执行 |
| `verification-before-completion` | 新鲜门禁、真实浏览器、CI 和生产证据 | 适用并执行 |
| `vitest` | schema、workflow、PWA、a11y 与性能契约测试 | 适用并执行 |
| `web-design-guidelines` | 响应式、溢出、间距、文本与交互反馈 | 适用并执行 |
| `web-perf` | 首屏请求、重路由预取、字体和 Lighthouse | 适用并执行 |

## 不适用 Skills 及原因

- 26 个 `Applicable (covered)`：`analyze-data-quality`、`audit-prep-assistant`、`benchmark`、
  `browse`、`code-documenter`、`code-reviewer`、`debugging-wizard`、`design-review`、
  `differential-review`、`fp-check`、`frontend-design`、`health`、`javascript-pro`、
  `nextjs-developer`、`node`、`playwright`、`playwright-expert`、`qa`、`react-expert`、
  `security-reviewer`、`sharp-edges`、`systematic-debugging`、`test-master`、
  `typescript-magician`、`vercel-react-best-practices`、`webapp-testing`。其关注面已由上表更具体
  Skill 覆盖，避免重复或冲突流程。
- 475 个不适用项主要属于原生/Expo、区块链、C/C++/Rust fuzzing、Cloudflare/ECS/backend、
  数据库/认证、Figma/视频/办公制品、营销增长、非本栈框架，以及本轮未触发的邮箱/PR/发布操作。
- 没有虚构 Skill。完整逐项原因以 inventory 为准。

# 2. 项目扫描结果

## 目录/模块概览

- 工作树共 307 个项目文件：`src/` 26、`scripts/` 24、`docs/` 32、`ai/` 16、11 个 workflow、
  40 个 daily JSON、124 个 `public/` 资产，另含 hooks、Claude 配置、quality 规则和根配置。
- 应用模块：`src/app/`、`src/features/home/`、`src/features/memes/`、
  `src/domain/memedaily/`、`src/domain/dailynews/`。
- 自动化模块：两条 publish/catchup/fallback/monitor 线、Pages、CI、cloud-fetch-check、
  trusted timestamp、数据 validator、hotlist prefetch 与 dispatch-pages。

## 关键文件

- 入口：`src/app/layout.tsx`、`src/app/page.tsx`、`src/app/archive/page.tsx`、
  `src/app/meme/[id]/page.tsx`、`src/features/home/HomeTabs.tsx`。
- 契约：两套 `schema.ts` / `rules.ts` / `data.ts` / `labels.ts` 与 40 个 JSON。
- 构建：`package*.json`、`next.config.mjs`、`tsconfig.json`、两个 ESLint config。
- 部署：`.github/workflows/*.yml`、`scripts/dispatch-pages.sh`、manifest、SW、CNAME、offline。
- 协作：`AGENTS.md`、`.cloud.md`、PROJECT_MAP、spec、plan、6 个 ADR、prompts、sessions。

## 文件类型覆盖情况

- 覆盖 TS/TSX、MJS/JS、CSS、JSON、YAML、Shell、Python、HTML、Markdown、manifest、TXT、ICO、
  PNG 和 WOFF2。二进制按格式签名、尺寸、引用完整性检查，不做无意义的逐字节文本审查。
- lockfile 检查 registry、integrity、git dependency、安装脚本、license 与依赖树；数据逐文件 parse、
  schema、policy、时间上界与跨日规则校验；workflow 逐文件 YAML、权限、Action SHA 和命令顺序审查。

## 审查边界说明

- `.git/`、`node_modules/`、`.next/`、`out/` 是元数据或生成目录，不作为源文件逐行审查；`out/`
  仍用于 127 页、详情路由、浏览器和 Lighthouse 验收。
- `docs/project/` 是历史 Claude 设计导出，已明确排除生产 lint；本轮检查其角色和引用，不重写生成代码。
- GitHub 与生产环境仅用于本仓远端/部署验收；未修改阿里云账户、DNS 或其他项目。

# 3. 审查计划

| 优先级 | 模块 | 高风险与核心对象 |
| --- | --- | --- |
| P0 | 发布安全 | AI 边界、写 token、rebase 竞态、最终树校验、Action SHA |
| P0 | 数据/状态 | schema、证据、最新运行、时间上界、fallback 与可见性 |
| P0 | 机械门禁 | secret、行数、头部、依赖边界、state、lint/types/tests/build |
| P1 | UI/PWA/a11y | 双 feed、详情、归档、复制反馈、移动暗色、manifest/SW/离线 |
| P1 | 性能/供应链 | archive prefetch、字体、包体、npm/lockfile、安装脚本 |
| P1 | 文档/协作 | AGENTS 顺序、session 命名、MAP、ADR、prompt、README |
| P2 | 残余风险 | Pages edge、历史导出、复杂度例外、工具缺口、外部凭据 |

# 4. 问题清单

| 编号 | 文件路径 | 问题描述 | 类别 | 严重程度 | 对应 Skill / 规范 | 是否已修复 |
| --- | --- | --- | --- | --- | --- | --- |
| F-01 | 4 个 writer workflow | 首次校验后 rebase，最终合并树未复验；写 token 同时暴露给 npm/validator 生命周期 | 发布/供应链 | 高 | agentic-actions-auditor, gha-security-review | 是 |
| F-02 | `daily-monitor.yml` | 仅按日期/通用“成本异常”查 Issue，可能把 MemeDaily 告警写进 DailyNews Issue | 监控正确性 | 中 | find-bugs, gha-security-review | 是 |
| F-03 | `page.tsx`, `HomeTabs.tsx` | 日报状态取最近可见日；最新 run 为 skipped/held 时会伪装成旧日成功 | 状态正确性 | 中 | react-best-practices, typescript-pro | 是 |
| F-04 | `dailynews/schema.ts`, `NewsCard.tsx` | 自动化/spec 要求媒体名，但 schema 允许缺 `outlet`，UI 被迫以 tier 假装媒体名 | 数据契约 | 中 | typescript-pro, documentation | 是 |
| F-05 | `create-skipped-news-day.ts` | fallback 仍把灾难列为禁区，与 DailyNews v2 明确允许民生灾情矛盾 | 规则漂移 | 低 | documentation, find-bugs | 是 |
| F-06 | `CopyButtons.tsx`, CSS, archive placeholder | 复制失败静默，异步结果无 live announcement；搜索 hint 缺省略号 | a11y/UX | 低 | accessibility, web-design-guidelines | 是 |
| F-07 | `layout.tsx`, `TodayFeed.tsx` | 首页自动预取约 397KB 梗库 RSC，抢占移动端首屏网络 | 性能 | 中 | web-perf, next-best-practices | 是 |
| F-08 | `pwa-surface.test.ts`, ADR-005 | describe callback 新增一条未登记复杂度告警 | 治理 | 低 | code-review, vitest | 是 |
| F-09 | constitution 与 3 个 start/handoff prompt | 仍要求先读 CLAUDE 再读 state，并使用过时 `YYYY-MM-DD.md` session 名 | 协作正典 | 中 | agents-md, documentation | 是 |
| F-10 | `PROJECT_MAP.md`, README, ADR-005 | 地图登记不存在的 `features/news/`，发布边界与复杂度计数过时 | 文档一致性 | 低 | documentation, agents-md | 是 |
| F-11 | 外部阿里云 RAM | 聊天中公开且曾重新启用的 AccessKey 已永久失去保密性 | 凭据 | 高 | security-review | 否，需账户操作 |
| F-12 | `docs/project/` | 历史生成导出含动态执行/外链原型模式，不符合生产规则 | 历史制品 | 低 | security-review, react-doctor | 不改；非生产隔离 |
| F-13 | 既有 16 个 TS/TSX 文件 | advisory complexity 仍有 37 条已登记例外 | 维护性 | 低 | code-review | ADR 接受 |
| F-14 | 本地工具环境 | actionlint、shellcheck、CodeQL/Semgrep、Chrome DevTools MCP 不可用 | 验证覆盖 | 低 | security-review, verification-before-completion | 替代验收 |

# 5. 修复记录

| 编号 | 修改文件 | 修复内容与原因 | 影响范围 | 风险说明 |
| --- | --- | --- | --- | --- |
| R-01 | 4 个 writer workflow、workflow test、ADR-006、Codex handoff | rebase 后 `npm ci` + `npm run check`；写 token 只进入最终 push/Pages step；新竞态以 non-fast-forward 失败 | 双线主发布与 fallback | 每次真实写入多一次安装/门禁，换取最终树与 token 隔离 |
| R-02 | meme monitor、workflow test | Issue 查询改为完整 MemeDaily 前缀 | 监控 Issue | 不改告警阈值或时间 |
| R-03 | page、`homeRunState.ts`、HomeTabs、page test | 两条 feed 共用“最新 run”事实计算；日报 stale/partial 也显示 notice 与“历史发布” | 首页状态 | 仅修事实展示，不改数据可见规则 |
| R-04 | news schema/test/card | `outlet` 收紧为必填并移除 tier fallback | 40 日数据与日报 UI | 全量历史数据已验证，未来缺媒体名会 fail closed |
| R-05 | skipped-news script | safety buckets 对齐 v2 活规则 | 晚间 skipped envelope | 不改变状态或发布时间 |
| R-06 | CopyButtons、CSS、archive、a11y test | 成功/失败可见且 `aria-live`；失败给权限/手动复制下一步；明确事件 helper 边界 | 详情与归档 | 剪贴板仍受浏览器权限控制 |
| R-07 | layout、TodayFeed、web-performance test | 重梗库 Link 设置 `prefetch={false}`，点击加载不变 | 首页首屏网络 | 首次点击梗库多一次正常导航请求 |
| R-08 | PWA test、CopyButtons、ADR-005 | 提取纯断言/事件/视图 helper，复杂度 39→37 | 测试与详情组件 | 无业务行为变化 |
| R-09 | constitution、start/SOP/handoff prompts | 统一 `.cloud.md` 首读与一会话一 slug 文件名 | 跨模型协作 | Claude adapter 仍由 `CLAUDE.md` 保留 |
| R-10 | PROJECT_MAP、README、state、plan、session | 修正真实模块与发布边界，登记新增文件和审计状态 | 文档/交接 | 历史审计不改写 |

# 6. 验收结果

| 验收编号 | 验收对象 | 验收标准 | 验收方法 | 验收结论 | 是否通过 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| A-01 | R-01 最终树/token | rebase 后重装复验；npm 在 token 前；push 在 token 后 | workflow static test + YAML parse + 顺序检索 | 4/4 writer 满足 | 是 | token 仅在最终 trusted shell step |
| A-02 | R-02 monitor | 两类 Issue lookup 均有 MemeDaily 前缀 | regression test + YAML 原文 | 不再仅按日期命中 | 是 | DailyNews monitor 原本已正确隔离 |
| A-03 | R-03 latest run | skipped 最新日不能被旧成功日替代 | synthetic unit test + current SSR/browser | skipped/partial/fresh 三类结果正确 | 是 | 当前生产样本为 meme partial/news published |
| A-04 | R-04 source outlet | 每个 news source 有 1-20 字 outlet | schema negative test + 15 日 JSON validation | 缺 outlet 被拒；现有数据全过 | 是 | UI 不再伪造 tier 媒体名 |
| A-05 | R-05 fallback | buckets 与 v2 活规则一致 | source review + schema parse | 灾难禁区移除，政策/八卦等命名对齐 | 是 | main no-op smoke 已通过；新日期生成由下次真实 fallback 覆盖 |
| A-06 | R-06 a11y | clipboard 成败可见/播报；移动交互可用 | Vitest + Playwright clipboard permission | “内容已复制”实测；失败文案有下一步 | 是 | Lighthouse accessibility 100 |
| A-07 | R-07 perf | 首页无 archive 预取，点击路由仍 200 | Playwright request log + Lighthouse 前后 | archive request 5→0；mobile perf 69→77 | 是 | FCP 3.2s→1.8s，LCP 9.1s→6.3s |
| A-08 | R-08 complexity | 本轮不新增未登记告警 | `npm run lint:complexity` | 37 warnings / 0 errors，与 ADR 一致 | 是（例外） | 审计前 39 |
| A-09 | React 改动 | changed scope 无真实 React 诊断 | React Doctor v0.7.7 before/after + code review | 最终 `No issues found` | 是 | 初报 2 项为 custom-hook 事件误判，结构澄清后消失 |
| A-10 | canonical gate | 两线数据、lint、types、tests、build 全绿 | `npm run check` | 25 meme、15 news、94 tests、127 pages | 是 | ESLint 0 warning，TypeScript 与静态导出通过 |
| A-11 | 机械治理 | strict checks 0 warning | state/file/header/import/secret scripts | 5/5 通过 | 是 | secret 历史高信号检索亦为 0 |
| A-12 | 供应链 | 依赖可解析、0 已知漏洞、lock integrity 完整 | `npm audit --audit-level=low`, `npm ls --all`, lock scan | 0 vulnerabilities；无 git dep/缺 integrity | 是 | patch/major 更新交给 Dependabot 独立审查 |
| A-13 | 浏览器功能 | desktop/390 dark 无溢出/错误；tabs/archive/detail/404 可用 | Playwright + 截图 | 200/200/200/404；overflow 0；键盘 tab 通过 | 是 | 预取取消产生的 abort 已随 R-07 消失 |
| A-14 | PWA 表面 | dark 偏好仍为 opaque `#fafafa`, only-light | static PWA test + computed styles | html/body/topbar 均 `rgb(250,250,250)`，无 blur | 是 | 物理 iOS 状态栏仍需人工确认 |
| A-15 | Lighthouse | a11y/best-practices 100；记录性能与 noindex | mobile/desktop 本地静态产物 | mobile 77/100/100/63；desktop 98/100/100/63 | 是（带残余） | SEO 63 来自产品明确 `noindex` |
| A-16 | 资源/数据 | 字体、PWA 图标、JSON、今日来源可访问 | 签名/引用/尺寸/parse/curl | 110/110 fonts；40 JSON；今日 14 URL 均 200/206 | 是 | 历史外链可随外站变化 |
| A-17 | 远端 CI/PR | PR 与 main 精确 SHA 的 CI 全绿 | `gh pr checks` / Actions | PR #32 runs `29313758214`/`29313775897`；main run `29313828480` | 是 | 分支 SHA `985d8c4`，merge SHA `5213cda` |
| A-18 | Pages/生产 | main 精确提交 Pages success；HTTPS/路由/资产正确 | `gh run`, curl, production Playwright | Pages `29313828427` success；apex/www/PWA/archive/detail 均 200，浏览器 0 error | 是 | 生产 commit `5213cdad99e8018685a302e1c5365c4d267faefd` |
| A-19 | fallback main smoke | 今日已存在时 no-op 且不触发 token push | 两个 workflow_dispatch + run logs | runs `29313998364` / `29314006065` success，push step skipped | 是 | 未改 data/main；真实 rebase 写入待下一日期 |

# 7. 未完成项 / 需人工确认项

| 文件路径/边界 | 问题 | 原因 | 建议下一步 |
| --- | --- | --- | --- |
| 外部阿里云 RAM | 已公开并重新启用的 AccessKey 不可信 | 仓库无法撤销云账户凭据 | 立即禁用/删除并新建最小权限 key；不要再发送到聊天或仓库 |
| iOS Chrome PWA | 顶部系统状态区最终观感 | 浏览器拥有该区域，桌面模拟不能证明物理设备 | 刷新/重装后用深色模式实机确认；异常时记录版本和录屏 |
| writer workflows | rebase 后真实写入分支尚未发生；no-op smoke 已通过 | 不能为验收主动消耗模型订阅或伪造次日数据 | 观察下一次 06:00/07:00；失败时保持 fail-closed，不放宽 token |
| `docs/project/` | 历史导出不符合生产 lint | 生成设计证据，不参与 runtime | 继续隔离；若重新启用，按生产标准重建而非直接上线 |
| 16 个 TS/TSX 文件 | 37 条复杂度例外 | JSX 与确定性 gate 的既有 ADR 决策 | 不为数字拆碎组件；新增告警必须修复或更新 ADR |
| 首页字体/数据 | mobile LCP 6.3s（本地 HTTP/1.0 throttling） | 自托管全量 CJK + 五日双 feed 数据较重 | 先看生产/RUM；若持续偏高，再产品决策首页天数或字体子集 |
| 工具链 | actionlint/shellcheck/CodeQL/Semgrep 缺失 | 当前机器未安装 | 可在独立 CI 增加；本轮以 YAML、bash -n、tests、ESLint、secret gate 替代 |
| SEO | Lighthouse SEO 63 | 产品要求 `noindex,nofollow` | 保持现状；只有产品转公开增长时才改 |
| legacy source URLs | 少量历史信源仍使用 HTTP | 外站原始链接与历史证据不应盲改 | 来源提供稳定 HTTPS 时逐条迁移，不伪造新链接 |

# 8. 最终结论

- **项目整体规范符合度：** 约 96%。当前代码、数据、文档、PWA、自动化、供应链、远端 CI、
  Pages 与生产行为全部通过；扣分项均为仓库外或已登记的残余风险。
- **本轮修复完成度：** 10 个可自动修复问题已完成 10 个；4 个残余项属于外部账户、历史制品、
  已登记复杂度或缺失工具，不以不安全改动强行“清零”。
- **当前剩余风险：** 最高风险仍是仓库外已泄露 Aliyun key；其次是下一次 writer 实跑、物理 iOS
  状态栏和长中文首页移动 LCP。
- **建议下一步动作：** 立即轮换 Aliyun key；观察下一次双线 schedule；完成 iOS 实机确认。性能只基于
  生产证据继续优化，不牺牲自托管字体和日期连续浏览需求。
