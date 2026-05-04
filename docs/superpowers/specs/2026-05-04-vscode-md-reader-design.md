# VSCode MD Reader 设计规格

## 概述

一个 VS Code 扩展，完全替代内置 Markdown 预览，提供更优的排版和完美的 Mermaid 图表渲染支持。兼容 Windsurf 和 Cursor。

## 核心定位

- **替代内置预览** — 注册为 `.md` 文件的默认预览提供者
- **完美 Mermaid 支持** — 所有图表类型 + 交互能力
- **阅读体验优先** — 排版美观、主题一致、导航便捷

## 技术栈

- TypeScript + VS Code Extension API
- Webview 面板（自建渲染管线）
- markdown-it（Markdown 解析）
- mermaid.js（图表渲染，最新版）
- markdown-it-anchor + markdown-it-toc-done-right（TOC 生成）

## 架构

```
┌─────────────────────────────────────┐
│  VS Code Extension Host             │
│  ┌─────────────┐  ┌──────────────┐  │
│  │ Extension   │  │ Webview      │  │
│  │ Main Thread │←→│ Panel        │  │
│  │             │  │              │  │
│  │ - 注册命令  │  │ - markdown-it│  │
│  │ - 监听编辑  │  │ - mermaid.js │  │
│  │ - 管理面板  │  │ - 自定义 CSS │  │
│  └─────────────┘  └──────────────┘  │
└─────────────────────────────────────┘
```

## 功能清单

### P0 — 必须实现

1. **预览命令** — `vscode-md-reader.openPreview` 打开侧边预览
2. **Markdown 渲染** — markdown-it 解析，支持 GFM（表格、任务列表、删除线、脚注）
3. **Mermaid 渲染** — mermaid.js 渲染所有图表类型：
   - flowchart, sequence, class, state, ER, gantt, pie
   - mindmap, timeline, gitgraph, sankey, quadrant
4. **实时同步** — 编辑器内容变更时自动刷新预览
5. **主题跟随** — 亮/暗色主题自动切换，Mermaid 主题同步
6. **代码高亮** — 使用 highlight.js 或 Shiki 对代码块着色

### P1 — 应该实现

7. **Mermaid 交互** — 图表支持缩放、拖拽、节点点击
8. **TOC 侧栏** — 标题大纲导航，点击跳转
9. **滚动同步** — 编辑器与预览双向滚动同步
10. **导出** — 支持导出为 HTML / PDF

### P2 — 可以实现

11. **自定义 CSS** — 用户可覆盖预览样式
12. **Mermaid 主题选择** — 提供多种 Mermaid 主题可选
13. **图片预览** — 点击图片放大查看

## 文件结构

```
vscode_md_reader/
├── src/
│   ├── extension.ts          # 入口：注册命令、激活扩展
│   ├── previewProvider.ts    # Webview 面板管理
│   ├── markdownEngine.ts    # markdown-it 配置与渲染
│   └── themeManager.ts      # VS Code 主题监听与 CSS 生成
├── webview/
│   ├── index.html            # Webview HTML 模板
│   ├── main.js               # Webview 入口：消息处理、Mermaid 初始化
│   ├── styles.css            # 预览样式
│   └── mermaid-renderer.js   # Mermaid 渲染逻辑
├── package.json              # 扩展清单
├── tsconfig.json
└── README.md
```

## 数据流

1. 用户打开 `.md` 文件 → 触发 `openPreview` 命令
2. Extension 创建 Webview 面板，注入初始 HTML + JS/CSS
3. Extension 监听编辑器 `onDidChangeTextDocument`
4. 内容变更 → markdown-it 解析 → 发送 HTML 到 Webview
5. Webview 接收 → 替换内容 → Mermaid 初始化渲染
6. Mermaid 渲染完成 → 图表可交互

## 主题方案

- 监听 VS Code `onDidChangeActiveColorTheme`
- 亮色主题 → Mermaid `default` 主题 + 亮色 CSS
- 暗色主题 → Mermaid `dark` 主题 + 暗色 CSS
- CSS 变量映射 VS Code 颜色 token（`--vscode-editor-background` 等）

## 错误处理

- Mermaid 语法错误 → 显示错误提示而非空白
- 文件读取失败 → 显示友好错误信息
- Webview 崩溃 → 自动重建面板

## 测试策略

- 手动测试：各种 Mermaid 图表类型的渲染
- 集成测试：VS Code 启动扩展、打开预览、编辑同步
- 回归测试：确保 GFM 扩展语法正常工作
