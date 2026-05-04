# MD Reader

专为 VS Code / Cursor / Windsurf 打造的 Markdown 阅读器，完美支持 Mermaid 图表渲染，替代内置预览。

## 架构

```text
┌──────────────────────────────────────────┐
│  VS Code Extension Host                  │
│                                          │
│  ┌──────────────────┐  ┌──────────────┐  │
│  │ Extension 主线程  │  │ Webview 面板 │  │
│  │                  │  │              │  │
│  │ extension.ts     │←→│ main.js      │  │
│  │ previewProvider  │  │ mermaid-     │  │
│  │ statusBar-       │  │  renderer.js │  │
│  │ Controller       │  │ styles.css   │  │
│  │ themeManager     │  │              │  │
│  │ markdownEngine   │  │ mermaid.js   │  │
│  └──────────────────┘  │ (CDN)        │  │
│         ↑               └──────────────┘  │
│         │ postMessage                     │
└──────────────────────────────────────────┘
```

**数据流：** 编辑器变更 → `markdownEngine` 解析 → `postMessage` 发 HTML → Webview 替换内容 → `mermaid-renderer` 渲染图表

## 功能

- **Mermaid 完美支持** — flowchart、sequence、class、state、ER、gantt、pie、mindmap、timeline、gitgraph、sankey、quadrant
- **主题跟随** — 自动适配 VS Code 亮/暗色主题，Mermaid 主题同步切换
- **状态栏切换** — 右下角一键切换「预览」/「原始内容」
- **GFM 完整支持** — 表格、任务列表、删除线、脚注
- **代码高亮** — highlight.js 语法着色
- **实时同步** — 编辑即刷新

## 使用

1. 打开 `.md` 文件，自动进入预览模式
2. 状态栏右下角点击「👁 预览」/「原始」切换视图
3. 命令面板执行 `MD Reader: 打开预览`

## 快速开始

```bash
git clone https://github.com/HOLYGITHUBUSER/vscode_md_reader.git
cd vscode_md_reader
npm install              # 装依赖
npm test                 # 单元测试（14 条）
npm run test:e2e         # Playwright 真浏览器 E2E（4 条）
npm run package          # 打 VSIX
```

装进 Cursor：

```bash
cursor --install-extension md-reader-0.1.0.vsix --force
```

## 目录结构

```text
vscode_md_reader/
├─ extension-扩展逻辑/        VS Code 扩展侧 TypeScript 源码、纯逻辑模块和单元测试
│  ├─ extension.ts           activate/deactivate 入口，注册命令、监听文档和主题
│  ├─ previewProvider.ts     Webview 面板创建、消息通信、HTML 注入
│  ├─ markdownEngine.ts      markdown-it 配置、GFM 渲染、Mermaid 块提取
│  ├─ themeManager.ts        VS Code 主题判断（亮/暗）、Mermaid 主题映射、CSS 变量生成
│  ├─ statusBarController.ts 状态栏右下角切换控件（预览/原始）
│  └─ test/                  Node 单元测试（jsdom harness）
│     ├─ markdown-render.test.ts   Markdown 渲染正确性（段落、表格、任务列表、删除线、Mermaid 块）
│     ├─ mermaid-extract.test.ts   Mermaid 代码块提取（单块、多块、忽略非 Mermaid）
│     ├─ theme-switch.test.ts      主题判断和 CSS 变量生成
│     ├─ statusbar-toggle.test.ts  状态栏切换逻辑（预览↔原始、文案）
│     └─ helpers/
│        └─ webview-harness.ts     jsdom harness：shim acquireVsCodeApi，模拟 DOM
├─ webview-预览界面/          Webview 前端脚本和样式
│  ├─ main.js                Webview 入口：接收 postMessage、替换内容、初始化 Mermaid
│  ├─ mermaid-renderer.js    Mermaid 渲染逻辑：初始化、渲染、错误处理、缩放交互
│  └─ styles.css             预览样式：排版、代码块、表格、Mermaid 容器、TOC
├─ e2e-浏览器测试/            Playwright 真浏览器端到端测试
│  ├─ playwright.config.ts   Playwright 配置（Chromium、串行、60s 超时）
│  ├─ harness.ts             自包含 HTML 组装：内联 webview JS + Mermaid CDN + shim
│  ├─ mermaid-flowchart.spec.ts    flowchart 渲染
│  ├─ mermaid-sequence.spec.ts     sequence 渲染
│  ├─ mermaid-mindmap.spec.ts      mindmap 渲染
│  └─ theme-sync.spec.ts           Mermaid dark 主题同步
├─ docs/                     设计规格和实现计划
│  └─ superpowers/
│     ├─ specs/              设计规格文档
│     └─ plans/              实现计划文档
├─ out/                      TypeScript 编译产物，可删除后 npm run compile 重建
├─ node_modules/             npm 依赖，可删除后 npm install 重装
├─ package.json              扩展清单：命令、配置、依赖、测试脚本
├─ tsconfig.json             TypeScript 编译配置
├─ .vscodeignore             VSIX 打包排除规则
└─ .gitignore                Git 忽略规则
```

## Webview 与扩展通信

前端到后端统一走 `vscode.postMessage`：

```text
webview script
  └─ postMessage({ type: 'webviewReady' })
        ↓
previewProvider.onDidReceiveMessage
        ↓
发送 HTML / 主题配置回 Webview
        ↓
webview.postMessage({ type: 'updateContent', html })
webview.postMessage({ type: 'updateTheme', mermaidTheme })
```

## 配置

| 设置 | 默认值 | 说明 |
|------|--------|------|
| `md-reader.defaultView` | `preview` | 打开 .md 文件时的默认视图 |
| `md-reader.mermaidTheme` | `default` | Mermaid 图表主题（自动模式下跟随 VS Code 主题覆盖） |

## 许可证

[MIT License](LICENSE)
