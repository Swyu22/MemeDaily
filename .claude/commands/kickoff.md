---
description: 新项目从零启动——先理解机制，再与你共创需求，然后固化进状态文件并开工
argument-hint: [一句话想法（可选）]
---
按 @ai/prompts/PROJECT_KICKOFF_PROMPT.md 启动新项目：

1. 确认机制就位（kit 文件是否在、是否需先复制+启用 hooks）
2. 与我做**需求共创**（分批提问，每批 3–5 个，别自问自答）
3. 输出理解（≤8 条）待我确认
4. 把结论固化进 `PROJECT_MAP` / `.cloud.md` / `current-iteration` / `spec`（先给草稿）
5. 给应用架构骨架（feature 模块化单体 + 单向依赖），切第一个最小纵切开工

可派 context-loader 子代理读取现有 kit 文件。我的初步想法（如有）：$ARGUMENTS
