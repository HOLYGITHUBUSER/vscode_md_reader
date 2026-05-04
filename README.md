# MD Reader — VS Code Markdown 阅读器

完美支持 Mermaid 图表渲染的 VS Code Markdown 预览扩展。兼容 Windsurf 和 Cursor。

## 功能

- **Mermaid 完美支持** — flowchart、sequence、class、state、ER、gantt、pie、mindmap、timeline、gitgraph、sankey、quadrant
- **主题跟随** — 自动适配 VS Code 亮/暗色主题，Mermaid 主题同步切换
- **状态栏切换** — 右下角一键切换「预览」/「原始内容」
- **GFM 完整支持** — 表格、任务列表、删除线、脚注
- **代码高亮** — highlight.js 语法着色
- **实时同步** — 编辑即刷新

## 使用

1. 打开 `.md` 文件，自动进入预览模式
2. 状态栏右下角点击「预览」/「原始」切换视图
3. 命令面板执行 `MD Reader: 打开预览`

## 开发

```bash
npm install          # 安装依赖
npm run compile      # 编译 TypeScript
npm test             # 单元测试
npm run test:e2e     # E2E 浏览器测试
npm run test:full    # 全流程测试
npm run package      # 打包 VSIX
```

## 配置

| 设置 | 默认值 | 说明 |
|------|--------|------|
| `md-reader.defaultView` | `preview` | 打开 .md 文件时的默认视图 |
| `md-reader.mermaidTheme` | `default` | Mermaid 图表主题 |
