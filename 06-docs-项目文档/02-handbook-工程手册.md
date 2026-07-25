# 工程手册

结构、命名、模块、测试、打包与安装。**一份说清怎么改、怎么验。**

---

## 1. 目录（编号排序）

```text
vscode_md_reader/
├─ 00-config-工程配置/       图标 / tsconfig
├─ 01-extension-扩展逻辑/    ★ 宿主 TS + 单测
├─ 02-webview-预览界面/      ★ webview-*.js / css
├─ 03-script-构建脚本/       build-编译打包.py
├─ 04-samples-试用样例/      手测 Markdown
├─ 05-e2e-浏览器测试/        Playwright
├─ 06-docs-项目文档/         本目录（仅 2 份文档）
├─ 07-artifacts-安装包/      时间戳 VSIX + build-info
├─ package.json              必须在根
└─ README.md
```

根目录尽量不堆散文件；`node_modules` / `out` / `99-backup-*` / lock / ignore 由 `files.exclude` 隐藏。

### 00-config

| 文件 | 用途 |
| --- | --- |
| `icon-扩展图标.png` | `package.json` → `icon` |
| `tsconfig-编译配置.json` | `npm run compile` |

### 01-extension 模块

| 文件 | 职责 |
| --- | --- |
| `extension.ts` | 激活入口、命令、文档/主题监听 |
| `previewProvider.ts` | Webview 面板与消息 |
| `markdownEngine.ts` | markdown-it 渲染 / Mermaid 块提取 |
| `themeManager.ts` | 亮暗判断与 CSS 变量 |
| `statusBarController.ts` | 状态栏预览/原始切换 |
| `test-单元测试/` | Node 单测 |

### 02-webview

| 文件 | 职责 |
| --- | --- |
| `webview-main.js` | 接收 postMessage、替换内容 |
| `webview-mermaid-renderer.js` | Mermaid 初始化与渲染 |
| `webview-styles.css` | 预览排版样式 |

### VSIX 进包内容

`out/`（不含测试）、`02-webview-预览界面/`、`00-config` 图标、`package.json`、`README.md`、运行时依赖。以 `.vscodeignore` 为准。

---

## 2. 命名规范

| 层级 | 范式 | 例 |
| --- | --- | --- |
| 顶层目录 | `{两位序号}-{en-kebab}-{中文}` | `01-extension-扩展逻辑/` |
| 文档 | `{两位序号}-{en}-{中文}.md` | `01-product-产品设计.md` |
| 脚本 | `{en-kebab}-{中文}.{ext}` | `build-编译打包.py` |
| 样例 | `{en}-{中文}.{ext}` | `smoke-日常验收.md` |
| Webview | `webview-{en-kebab}.js` | `webview-main.js` |
| 扩展 TS | 英文 | `previewProvider.ts` |

**禁止：** 无编号业务顶层目录；根目录堆 icon/tsconfig 等散文件。

归档死代码 → `99-backup-归档旧文件/`（gitignore）。

---

## 3. 开发命令

```bash
npm install                 # 依赖
npm run compile             # tsc → out/
npm test                    # 单测
npm run test:e2e            # Playwright
npm run test:full           # test + e2e + package
npm run package:force       # 不升版打包
npm run package             # 升 PATCH 再打包
```

一键：

```bash
python3 03-script-构建脚本/build-编译打包.py
```

产物：`07-artifacts-安装包/md-reader-v{version}-{YYYYMMDD}-{HHmmss}.vsix`（只保留最新 1 个）。

```bash
cursor --install-extension 07-artifacts-安装包/md-reader-v….vsix --force
# 然后 Developer: Reload Window
```

---

## 4. 测试维度

| 层 | 位置 | 覆盖 |
| --- | --- | --- |
| 单测 | `01-…/test-单元测试/` | 渲染、Mermaid 提取、主题、状态栏 |
| E2E | `05-e2e-浏览器测试/` | flowchart / sequence / mindmap / 主题 |
| 手测 | `04-samples-试用样例/smoke-日常验收.md` | 预览、状态栏、亮暗切换 |

---

## 5. 通信

```text
webview → postMessage({ type: 'webviewReady' })
previewProvider → postMessage({ type: 'updateContent', html })
previewProvider → postMessage({ type: 'updateTheme', mermaidTheme })
```
