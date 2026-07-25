# MD Reader

![MD Reader 图标](00-config-工程配置/icon-扩展图标.png)

专为 VS Code / Cursor / Windsurf 打造的 Markdown 阅读器，完美支持 Mermaid 图表渲染，替代内置预览。

## 功能

- **Mermaid** — flowchart、sequence、mindmap 等
- **主题跟随** — 亮/暗色与 Mermaid 主题同步
- **状态栏切换** — 「预览」/「原始内容」
- **GFM** — 表格、任务列表、删除线等
- **实时同步** — 编辑即刷新

## 使用

1. 打开 `.md` 文件（默认进入预览）
2. 状态栏右下角切换「预览」/「原始」
3. 命令面板：`MD Reader: 打开预览`

## 快速开始

```bash
git clone https://github.com/HOLYGITHUBUSER/vscode_md_reader.git
cd vscode_md_reader
npm install
npm test
npm run test:e2e
python3 03-script-构建脚本/build-编译打包.py
cursor --install-extension 07-artifacts-安装包/md-reader-v….vsix --force
```

## 目录结构

```text
vscode_md_reader/
├─ 00-config-工程配置/
├─ 01-extension-扩展逻辑/
├─ 02-webview-预览界面/
├─ 03-script-构建脚本/
├─ 04-samples-试用样例/
├─ 05-e2e-浏览器测试/
├─ 06-docs-项目文档/          # 01-product + 02-handbook
├─ 07-artifacts-安装包/
├─ package.json
└─ README.md
```

详细说明见 [06-docs-项目文档/02-handbook-工程手册.md](06-docs-项目文档/02-handbook-工程手册.md)。

## 配置

| 设置 | 默认值 | 说明 |
|------|--------|------|
| `md-reader.defaultView` | `preview` | 打开 .md 时的默认视图 |
| `md-reader.mermaidTheme` | `default` | Mermaid 主题 |

## 许可证

MIT
