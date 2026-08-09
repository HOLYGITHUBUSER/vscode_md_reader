# MD Editor

![MD Editor 图标](00-config-工程配置/icon-扩展图标.png)

专为 VS Code / Cursor / Windsurf 打造的 Markdown 所见即所得编辑器。可在预览页直接修改正文，自动回写 `.md` 源文件，并保留 Mermaid 图表渲染。

## 功能

- **Mermaid** — flowchart、sequence、mindmap 等
- **主题跟随** — 亮/暗色与 Mermaid 主题同步
- **状态栏切换** — 「预览」/「原始内容」
- **GFM** — 表格、任务列表、删除线等
- **所见即所得编辑** — 预览正文可直接修改，自动回写 Markdown
- **源码兜底** — 顶部标签可切回源码，处理复杂 Markdown
- **Mermaid 保护** — 图表在预览页保持只读，需在源码页修改图表语法

## 使用

1. 打开 `.md` → **MD Editor 同一界面**（默认可编辑预览标签）
2. 直接在预览正文中输入、删除或调整文本，修改会自动回写 Markdown。
3. Mermaid 图表不可直接编辑；切到 **源码** 标签修改其代码块。
4. 状态栏也可点切换源码/预览。
5. 回系统编辑：右键标签 → **Open With… → Text Editor**。

## 快速开始

```bash
git clone https://github.com/HOLYGITHUBUSER/vscode_md_reader.git
cd vscode_md_reader
npm install
npm test
npm run test:e2e
python3 03-script-构建脚本/build-编译打包.py
cursor --install-extension 07-artifacts-安装包/md-editor-v….vsix --force
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
| `md-editor.defaultView` | `preview` | 打开 .md 时的默认视图 |
| `md-editor.mermaidTheme` | `default` | Mermaid 主题 |

## 许可证

MIT
