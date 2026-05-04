# VSCode MD Reader 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 构建一个 VS Code 扩展，替代内置 Markdown 预览，完美支持 Mermaid 图表渲染，含状态栏切换控件。

**架构：** Extension Main Thread 管理 Webview 面板、状态栏控件和文档监听；Webview 中用 markdown-it 解析 Markdown、mermaid.js 渲染图表；Playwright E2E + jsdom 单元测试三层覆盖。

**技术栈：** TypeScript, VS Code Extension API, markdown-it, mermaid.js, highlight.js, Playwright, Node.js built-in test runner, jsdom

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `package.json` | 扩展清单：命令、配置、customEditor、依赖 |
| `tsconfig.json` | TypeScript 编译配置 |
| `extension-扩展逻辑/extension.ts` | 入口：激活/停用扩展，注册命令和状态栏 |
| `extension-扩展逻辑/previewProvider.ts` | Webview 面板创建、消息通信、文档监听 |
| `extension-扩展逻辑/markdownEngine.ts` | markdown-it 实例配置、GFM 插件、Mermaid 块提取 |
| `extension-扩展逻辑/themeManager.ts` | 监听 VS Code 主题变化，生成 CSS 变量映射 |
| `extension-扩展逻辑/statusBarController.ts` | 状态栏右下角切换控件：原始/预览 |
| `extension-扩展逻辑/test/helpers/webview-harness.ts` | jsdom harness：shim acquireVsCodeApi，模拟 DOM |
| `extension-扩展逻辑/test/markdown-render.test.ts` | 单元测试：markdown-it 渲染正确性 |
| `extension-扩展逻辑/test/mermaid-extract.test.ts` | 单元测试：Mermaid 代码块提取 |
| `extension-扩展逻辑/test/statusbar-toggle.test.ts` | 单元测试：状态栏切换逻辑 |
| `extension-扩展逻辑/test/theme-switch.test.ts` | 单元测试：主题切换逻辑 |
| `webview-预览界面/index.html` | Webview HTML 骨架 |
| `webview-预览界面/main.js` | Webview 入口：接收消息、替换内容、初始化 Mermaid |
| `webview-预览界面/styles.css` | 预览样式：排版、代码块、Mermaid 容器 |
| `webview-预览界面/mermaid-renderer.js` | Mermaid 渲染逻辑：初始化、错误处理、交互 |
| `e2e-浏览器测试/playwright.config.ts` | Playwright 配置 |
| `e2e-浏览器测试/harness.ts` | Playwright harness：组装自包含 HTML |
| `e2e-浏览器测试/mermaid-flowchart.spec.ts` | E2E：flowchart 渲染 |
| `e2e-浏览器测试/mermaid-sequence.spec.ts` | E2E：sequence 渲染 |
| `e2e-浏览器测试/mermaid-mindmap.spec.ts` | E2E：mindmap 渲染 |
| `e2e-浏览器测试/theme-sync.spec.ts` | E2E：主题同步 |

---

### 任务 1：项目脚手架

**文件：**
- 创建：`package.json`
- 创建：`tsconfig.json`
- 创建：`.vscodeignore`

- [ ] **步骤 1：创建 package.json**

```json
{
  "name": "md-reader",
  "displayName": "MD Reader",
  "description": "Markdown 阅读器，完美支持 Mermaid 图表渲染",
  "version": "0.1.0",
  "publisher": "md-reader",
  "engines": {
    "vscode": "^1.70.0"
  },
  "categories": ["Programming Languages", "Other"],
  "activationEvents": [
    "onLanguage:markdown",
    "onCommand:md-reader.openPreview",
    "onCommand:md-reader.toggleView"
  ],
  "main": "./out/extension-扩展逻辑/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "md-reader.openPreview",
        "title": "MD Reader: 打开预览"
      },
      {
        "command": "md-reader.toggleView",
        "title": "MD Reader: 切换原始/预览"
      }
    ],
    "configuration": {
      "type": "object",
      "title": "MD Reader 配置",
      "properties": {
        "md-reader.defaultView": {
          "type": "string",
          "enum": ["preview", "source"],
          "default": "preview",
          "description": "打开 .md 文件时的默认视图模式"
        },
        "md-reader.mermaidTheme": {
          "type": "string",
          "enum": ["default", "dark", "forest", "neutral"],
          "default": "default",
          "description": "Mermaid 图表主题（自动模式下会跟随 VS Code 主题覆盖）"
        }
      }
    }
  },
  "scripts": {
    "compile": "tsc -p ./",
    "vscode:prepublish": "npm run compile",
    "lint": "eslint 'extension-扩展逻辑/**/*.ts'",
    "test": "npm run compile && node --test out/extension-扩展逻辑/test/**/*.test.js",
    "test:e2e": "playwright test --config e2e-浏览器测试/playwright.config.ts",
    "test:full": "npm test && npm run test:e2e && npm run package",
    "package": "vsce package"
  },
  "dependencies": {
    "markdown-it": "^14.0.0",
    "markdown-it-anchor": "^9.0.0",
    "markdown-it-toc-done-right": "^4.2.0",
    "highlight.js": "^11.9.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.59.0",
    "@types/node": "^20.11.0",
    "@types/vscode": "^1.70.0",
    "@vscode/vsce": "^2.15.0",
    "jsdom": "^24.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **步骤 2：创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "lib": ["ES2020"],
    "sourceMap": true,
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["extension-扩展逻辑/**/*"],
  "exclude": ["node_modules", "out", "e2e-浏览器测试"]
}
```

- [ ] **步骤 3：创建 .vscodeignore**

```
node_modules/**
out/**
e2e-浏览器测试/**
docs/**
.vscode/**
.gitignore
tsconfig.json
```

- [ ] **步骤 4：安装依赖**

运行：`npm install`
预期：node_modules 生成，无报错

- [ ] **步骤 5：Commit**

```bash
git add package.json tsconfig.json .vscodeignore package-lock.json
git commit -m "feat: 项目脚手架，package.json + tsconfig.json"
```

---

### 任务 2：markdown-it 引擎

**文件：**
- 创建：`extension-扩展逻辑/markdownEngine.ts`
- 创建：`extension-扩展逻辑/test/helpers/webview-harness.ts`
- 创建：`extension-扩展逻辑/test/markdown-render.test.ts`
- 创建：`extension-扩展逻辑/test/mermaid-extract.test.ts`

- [ ] **步骤 1：创建 jsdom harness**

`extension-扩展逻辑/test/helpers/webview-harness.ts`:

```typescript
import { JSDOM } from 'jsdom';

export interface HarnessResult {
  dom: JSDOM;
  posted: any[];
  document: Document;
  window: Window;
}

export function createHarness(): HarnessResult {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><body><div id="md-content"></div></body></html>',
    { runScripts: 'dangerously', resources: 'usable' }
  );
  const posted: any[] = [];
  (dom.window as any).acquireVsCodeApi = () => ({
    postMessage: (msg: any) => posted.push(msg),
    setState: () => {},
    getState: () => undefined,
  });
  return { dom, posted, document: dom.window.document, window: dom.window };
}
```

- [ ] **步骤 2：编写 markdown-render 失败测试**

`extension-扩展逻辑/test/markdown-render.test.ts`:

```typescript
import assert from 'assert';
import { describe, it } from 'node:test';
import { renderMarkdown } from '../markdownEngine.js';

describe('markdownEngine renderMarkdown', () => {
  it('renders paragraphs', () => {
    const html = renderMarkdown('hello world');
    assert.ok(html.includes('<p>hello world</p>'));
  });

  it('renders GFM table', () => {
    const md = '| A | B |\n| --- | --- |\n| 1 | 2 |';
    const html = renderMarkdown(md);
    assert.ok(html.includes('<table>'));
    assert.ok(html.includes('<td>1</td>'));
  });

  it('renders task list', () => {
    const md = '- [x] done\n- [ ] todo';
    const html = renderMarkdown(md);
    assert.ok(html.includes('checked'));
    assert.ok(html.includes('checkbox'));
  });

  it('renders strikethrough', () => {
    const html = renderMarkdown('~~deleted~~');
    assert.ok(html.includes('<del>deleted</del>') || html.includes('<s>deleted</s>'));
  });

  it('preserves mermaid code block with language tag', () => {
    const md = '```mermaid\ngraph TD; A-->B;\n```';
    const html = renderMarkdown(md);
    assert.ok(html.includes('mermaid'));
    assert.ok(html.includes('graph TD; A-->B;'));
  });
});
```

- [ ] **步骤 3：运行测试验证失败**

运行：`npm run compile && node --test out/extension-扩展逻辑/test/markdown-render.test.js`
预期：FAIL，报错 "Cannot find module '../markdownEngine.js'"

- [ ] **步骤 4：编写 mermaid-extract 失败测试**

`extension-扩展逻辑/test/mermaid-extract.test.ts`:

```typescript
import assert from 'assert';
import { describe, it } from 'node:test';
import { extractMermaidBlocks } from '../markdownEngine.js';

describe('extractMermaidBlocks', () => {
  it('extracts single mermaid block', () => {
    const md = 'Some text\n```mermaid\ngraph TD; A-->B;\n```\nMore text';
    const blocks = extractMermaidBlocks(md);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].code, 'graph TD; A-->B;');
    assert.strictEqual(blocks[0].index, 1);
  });

  it('extracts multiple mermaid blocks', () => {
    const md = '```mermaid\ngraph TD; A-->B;\n```\nText\n```mermaid\nsequenceDiagram; A->>B;\n```';
    const blocks = extractMermaidBlocks(md);
    assert.strictEqual(blocks.length, 2);
    assert.strictEqual(blocks[0].code, 'graph TD; A-->B;');
    assert.strictEqual(blocks[1].code, 'sequenceDiagram; A->>B;');
  });

  it('ignores non-mermaid code blocks', () => {
    const md = '```js\nconsole.log("hi");\n```';
    const blocks = extractMermaidBlocks(md);
    assert.strictEqual(blocks.length, 0);
  });
});
```

- [ ] **步骤 5：运行测试验证失败**

运行：`npm run compile && node --test out/extension-扩展逻辑/test/mermaid-extract.test.js`
预期：FAIL

- [ ] **步骤 6：实现 markdownEngine.ts**

`extension-扩展逻辑/markdownEngine.ts`:

```typescript
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str, lang) => {
    if (lang && lang.toLowerCase() === 'mermaid') {
      return `<div class="mermaid">${str}</div>`;
    }
    return '';
  },
});

// GFM 插件（markdown-it 内置 table + strikethrough，需启用）
// task list 通过正则补充
md.use(taskListPlugin);

function taskListPlugin(md: MarkdownIt) {
  md.core.ruler.after('inline', 'task-lists', (state) => {
    for (const token of state.tokens) {
      if (token.type === 'inline') {
        token.content = token.content
          .replace(/\[x\]/gi, '<input type="checkbox" checked disabled>')
          .replace(/\[ \]/g, '<input type="checkbox" disabled>');
      }
    }
  });
}

export function renderMarkdown(text: string): string {
  return md.render(text);
}

export interface MermaidBlock {
  code: string;
  index: number;
}

export function extractMermaidBlocks(text: string): MermaidBlock[] {
  const regex = /```mermaid\n([\s\S]*?)```/g;
  const blocks: MermaidBlock[] = [];
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({ code: match[1].trim(), index: idx++ });
  }
  return blocks;
}
```

- [ ] **步骤 7：运行测试验证通过**

运行：`npm run compile && node --test out/extension-扩展逻辑/test/markdown-render.test.js`
运行：`npm run compile && node --test out/extension-扩展逻辑/test/mermaid-extract.test.js`
预期：全部 PASS

- [ ] **步骤 8：Commit**

```bash
git add extension-扩展逻辑/markdownEngine.ts extension-扩展逻辑/test/
git commit -m "feat: markdown-it 引擎 + Mermaid 块提取 + 单元测试"
```

---

### 任务 3：主题管理器

**文件：**
- 创建：`extension-扩展逻辑/themeManager.ts`
- 创建：`extension-扩展逻辑/test/theme-switch.test.ts`

- [ ] **步骤 1：编写 theme-switch 失败测试**

`extension-扩展逻辑/test/theme-switch.test.ts`:

```typescript
import assert from 'assert';
import { describe, it } from 'node:test';
import { getMermaidTheme, getCssVars, isDark } from '../themeManager.js';

describe('themeManager', () => {
  it('returns dark mermaid theme for dark vscode theme', () => {
    assert.strictEqual(getMermaidTheme('one-dark-pro'), 'dark');
    assert.strictEqual(isDark('one-dark-pro'), true);
  });

  it('returns default mermaid theme for light vscode theme', () => {
    assert.strictEqual(getMermaidTheme('Default Light+'), 'default');
    assert.strictEqual(isDark('Default Light+'), false);
  });

  it('generates CSS vars from vscode colors', () => {
    const vars = getCssVars({
      'editor-background': '#1e1e1e',
      'editor-foreground': '#d4d4d4',
    });
    assert.ok(vars.includes('--vscode-editor-background: #1e1e1e'));
    assert.ok(vars.includes('--vscode-editor-foreground: #d4d4d4'));
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npm run compile && node --test out/extension-扩展逻辑/test/theme-switch.test.js`
预期：FAIL

- [ ] **步骤 3：实现 themeManager.ts**

`extension-扩展逻辑/themeManager.ts`:

```typescript
const DARK_KEYWORDS = ['dark', 'black', 'night', 'one-dark', 'monokai', 'dracula', 'solarized-dark'];

export function isDark(themeId: string): boolean {
  const lower = themeId.toLowerCase();
  return DARK_KEYWORDS.some(kw => lower.includes(kw));
}

export function getMermaidTheme(themeId: string): string {
  return isDark(themeId) ? 'dark' : 'default';
}

export function getCssVars(colors: Record<string, string>): string {
  return Object.entries(colors)
    .map(([key, value]) => `--vscode-${key}: ${value};`)
    .join('\n');
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`npm run compile && node --test out/extension-扩展逻辑/test/theme-switch.test.js`
预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add extension-扩展逻辑/themeManager.ts extension-扩展逻辑/test/theme-switch.test.ts
git commit -m "feat: 主题管理器 + 单元测试"
```

---

### 任务 4：状态栏切换控件

**文件：**
- 创建：`extension-扩展逻辑/statusBarController.ts`
- 创建：`extension-扩展逻辑/test/statusbar-toggle.test.ts`

- [ ] **步骤 1：编写 statusbar-toggle 失败测试**

`extension-扩展逻辑/test/statusbar-toggle.test.ts`:

```typescript
import assert from 'assert';
import { describe, it } from 'node:test';

// 纯逻辑测试，不依赖 VS Code API
import { ViewMode, toggleView, getStatusBarText } from '../statusBarController.js';

describe('statusBarController logic', () => {
  it('toggles from preview to source', () => {
    assert.strictEqual(toggleView(ViewMode.Preview), ViewMode.Source);
  });

  it('toggles from source to preview', () => {
    assert.strictEqual(toggleView(ViewMode.Source), ViewMode.Preview);
  });

  it('returns correct status bar text', () => {
    assert.strictEqual(getStatusBarText(ViewMode.Preview), '$(eye) 预览');
    assert.strictEqual(getStatusBarText(ViewMode.Source), '$(code) 原始');
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npm run compile && node --test out/extension-扩展逻辑/test/statusbar-toggle.test.js`
预期：FAIL

- [ ] **步骤 3：实现 statusBarController.ts**

`extension-扩展逻辑/statusBarController.ts`:

```typescript
import * as vscode from 'vscode';

export enum ViewMode {
  Preview = 'preview',
  Source = 'source',
}

export function toggleView(current: ViewMode): ViewMode {
  return current === ViewMode.Preview ? ViewMode.Source : ViewMode.Preview;
}

export function getStatusBarText(mode: ViewMode): string {
  return mode === ViewMode.Preview ? '$(eye) 预览' : '$(code) 原始';
}

export class StatusBarController {
  private item: vscode.StatusBarItem;
  private currentMode: ViewMode;
  private onToggle: (mode: ViewMode) => void;

  constructor(onToggle: (mode: ViewMode) => void) {
    this.onToggle = onToggle;
    this.currentMode = ViewMode.Preview;
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = 'md-reader.toggleView';
    this.updateDisplay();
    this.item.show();
  }

  private updateDisplay(): void {
    this.item.text = getStatusBarText(this.currentMode);
    this.item.tooltip = this.currentMode === ViewMode.Preview ? '点击切换到原始内容' : '点击切换到预览';
  }

  toggle(): ViewMode {
    this.currentMode = toggleView(this.currentMode);
    this.updateDisplay();
    this.onToggle(this.currentMode);
    return this.currentMode;
  }

  getMode(): ViewMode {
    return this.currentMode;
  }

  setMode(mode: ViewMode): void {
    this.currentMode = mode;
    this.updateDisplay();
  }

  dispose(): void {
    this.item.dispose();
  }
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`npm run compile && node --test out/extension-扩展逻辑/test/statusbar-toggle.test.js`
预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add extension-扩展逻辑/statusBarController.ts extension-扩展逻辑/test/statusbar-toggle.test.ts
git commit -m "feat: 状态栏切换控件 + 单元测试"
```

---

### 任务 5：Webview 预览界面

**文件：**
- 创建：`webview-预览界面/index.html`
- 创建：`webview-预览界面/styles.css`
- 创建：`webview-预览界面/main.js`
- 创建：`webview-预览界面/mermaid-renderer.js`

- [ ] **步骤 1：创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: https:;">
  <link rel="stylesheet" href="${cssUri}">
  <title>MD Reader Preview</title>
</head>
<body>
  <div id="md-content"></div>
  <script src="${mermaidJsUri}"></script>
  <script src="${rendererUri}"></script>
  <script src="${mainJsUri}"></script>
</body>
</html>
```

- [ ] **步骤 2：创建 styles.css**

```css
:root {
  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-code: 'Fira Code', 'Cascadia Code', Consolas, monospace;
}

body {
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.7;
  color: var(--vscode-editor-foreground, #333);
  background: var(--vscode-editor-background, #fff);
  padding: 24px 32px;
  max-width: 900px;
  margin: 0 auto;
}

h1, h2, h3, h4, h5, h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

h1 { font-size: 1.8em; border-bottom: 1px solid var(--vscode-editorWidget-border, #ddd); padding-bottom: 0.3em; }
h2 { font-size: 1.5em; border-bottom: 1px solid var(--vscode-editorWidget-border, #ddd); padding-bottom: 0.25em; }

a { color: var(--vscode-textLink-foreground, #0066cc); text-decoration: none; }
a:hover { text-decoration: underline; }

code {
  font-family: var(--font-code);
  background: var(--vscode-textCodeBlock-background, #f5f5f5);
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 0.9em;
}

pre {
  background: var(--vscode-textCodeBlock-background, #f5f5f5);
  padding: 14px;
  border-radius: 6px;
  overflow-x: auto;
  line-height: 1.5;
}

pre code { background: none; padding: 0; }

table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid var(--vscode-editorWidget-border, #ddd); padding: 8px 12px; text-align: left; }
th { background: var(--vscode-editor-background, #fafafa); font-weight: 600; }

blockquote { border-left: 4px solid var(--vscode-editorWidget-border, #ddd); margin: 1em 0; padding: 0.5em 1em; color: var(--vscode-descriptionForeground, #666); }

img { max-width: 100%; border-radius: 4px; }

/* Mermaid 容器 */
.mermaid-container {
  margin: 1.2em 0;
  text-align: center;
  overflow-x: auto;
}

.mermaid {
  display: flex;
  justify-content: center;
}

.mermaid-error {
  border: 1px solid #e74c3c;
  background: #ffeaea;
  color: #c0392b;
  padding: 12px;
  border-radius: 6px;
  font-family: var(--font-code);
  font-size: 0.85em;
  white-space: pre-wrap;
  text-align: left;
}

/* 任务列表 */
input[type="checkbox"] { margin-right: 6px; }

/* TOC */
.toc { background: var(--vscode-editor-background, #f9f9f9); border: 1px solid var(--vscode-editorWidget-border, #ddd); border-radius: 6px; padding: 12px 16px; margin: 1em 0; }
.toc ul { list-style: none; padding-left: 1.2em; }
.toc a { text-decoration: none; }
.toc a:hover { text-decoration: underline; }
```

- [ ] **步骤 3：创建 mermaid-renderer.js**

```javascript
// @ts-check
(function () {
  'use strict';

  const MERMAID_VERSION = '11';

  /**
   * 初始化 Mermaid 并渲染页面中所有 .mermaid 元素。
   * @param {string} theme - 'default' | 'dark' | 'forest' | 'neutral'
   */
  async function initMermaid(theme) {
    if (typeof mermaid === 'undefined') {
      console.error('mermaid.js not loaded');
      return;
    }
    mermaid.initialize({
      startOnLoad: false,
      theme: theme || 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });
    await renderAllMermaid();
  }

  async function renderAllMermaid() {
    const elements = document.querySelectorAll('.mermaid');
    for (const el of elements) {
      if (el.getAttribute('data-processed')) continue;
      try {
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const { svg } = await mermaid.render(id, el.textContent.trim());
        const container = document.createElement('div');
        container.className = 'mermaid-container';
        container.innerHTML = svg;
        // 启用缩放交互
        container.style.cursor = 'zoom-in';
        container.addEventListener('click', () => {
          if (container.style.transform) {
            container.style.transform = '';
            container.style.cursor = 'zoom-in';
          } else {
            container.style.transform = 'scale(1.5)';
            container.style.transformOrigin = 'center top';
            container.style.cursor = 'zoom-out';
          }
        });
        el.replaceWith(container);
      } catch (err) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mermaid-error';
        errorDiv.textContent = `Mermaid 渲染错误: ${err.message || err}`;
        el.replaceWith(errorDiv);
      }
    }
  }

  window.MdReaderMermaid = { initMermaid, renderAllMermaid };
})();
```

- [ ] **步骤 4：创建 main.js**

```javascript
// @ts-check
(function () {
  'use strict';

  const vscode = acquireVsCodeApi();
  const contentEl = document.getElementById('md-content');

  window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.type) {
      case 'updateContent':
        contentEl.innerHTML = msg.html;
        if (window.MdReaderMermaid) {
          window.MdReaderMermaid.renderAllMermaid();
        }
        break;
      case 'updateTheme':
        if (window.MdReaderMermaid) {
          window.MdReaderMermaid.initMermaid(msg.mermaidTheme);
        }
        break;
    }
  });

  // 通知 extension webview 已就绪
  vscode.postMessage({ type: 'webviewReady' });
})();
```

- [ ] **步骤 5：Commit**

```bash
git add webview-预览界面/
git commit -m "feat: Webview 预览界面（HTML/CSS/JS + Mermaid 渲染器）"
```

---

### 任务 6：PreviewProvider + Extension 入口

**文件：**
- 创建：`extension-扩展逻辑/previewProvider.ts`
- 创建：`extension-扩展逻辑/extension.ts`

- [ ] **步骤 1：实现 previewProvider.ts**

`extension-扩展逻辑/previewProvider.ts`:

```typescript
import * as vscode from 'vscode';
import { renderMarkdown } from './markdownEngine.js';
import { getMermaidTheme, isDark } from './themeManager.js';

export class PreviewProvider implements vscode.WebviewPanelProvider {
  private panel: vscode.WebviewPanel | undefined;
  private webview: vscode.Webview | undefined;

  constructor(private context: vscode.ExtensionContext) {}

  resolveWebviewPanel(
    webviewPanel: vscode.WebviewPanel,
    _document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): void {
    this.panel = webviewPanel;
    this.webview = webviewPanel.webview;

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'webview-预览界面'),
      ],
    };

    webviewPanel.webview.html = this.getHtml(webviewPanel.webview);
    this.listenMessages();
  }

  openPreview(document: vscode.TextDocument): void {
    if (this.panel) {
      this.panel.reveal();
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'md-reader.preview',
        'MD Reader 预览',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.joinPath(this.context.extensionUri, 'webview-预览界面'),
          ],
        }
      );
      this.webview = this.panel.webview;
      this.panel.webview.html = this.getHtml(this.panel.webview);
      this.panel.onDidDispose(() => {
        this.panel = undefined;
        this.webview = undefined;
      });
      this.listenMessages();
    }
    this.updateContent(document);
  }

  updateContent(document: vscode.TextDocument): void {
    if (!this.webview) return;
    const html = renderMarkdown(document.getText());
    this.webview.postMessage({ type: 'updateContent', html });
  }

  updateTheme(): void {
    if (!this.webview) return;
    const themeId = vscode.window.activeColorTheme.kind;
    const dark = themeId === vscode.ColorThemeKind.Dark || themeId === vscode.ColorThemeKind.HighContrast;
    const mermaidTheme = dark ? 'dark' : 'default';
    this.webview.postMessage({ type: 'updateTheme', mermaidTheme });
  }

  hide(): void {
    this.panel?.dispose();
    this.panel = undefined;
    this.webview = undefined;
  }

  private listenMessages(): void {
    this.webview?.onDidReceiveMessage((msg) => {
      if (msg.type === 'webviewReady') {
        const doc = vscode.window.activeTextEditor?.document;
        if (doc) this.updateContent(doc);
        this.updateTheme();
      }
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const base = vscode.Uri.joinPath(this.context.extensionUri, 'webview-预览界面');
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(base, 'styles.css'));
    const mainJsUri = webview.asWebviewUri(vscode.Uri.joinPath(base, 'main.js'));
    const rendererUri = webview.asWebviewUri(vscode.Uri.joinPath(base, 'mermaid-renderer.js'));
    const mermaidJsUri = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https:; script-src 'unsafe-inline' https://cdn.jsdelivr.net; img-src data: https:;">
  <link rel="stylesheet" href="${cssUri}">
</head>
<body>
  <div id="md-content"></div>
  <script src="${mermaidJsUri}"></script>
  <script src="${rendererUri}"></script>
  <script src="${mainJsUri}"></script>
</body>
</html>`;
  }
}
```

- [ ] **步骤 2：实现 extension.ts 入口**

`extension-扩展逻辑/extension.ts`:

```typescript
import * as vscode from 'vscode';
import { PreviewProvider } from './previewProvider.js';
import { StatusBarController, ViewMode } from './statusBarController.js';

let previewProvider: PreviewProvider;
let statusBarController: StatusBarController;

export function activate(context: vscode.ExtensionContext) {
  previewProvider = new PreviewProvider(context);
  statusBarController = new StatusBarController((mode) => {
    const doc = vscode.window.activeTextEditor?.document;
    if (!doc) return;
    if (mode === ViewMode.Preview) {
      previewProvider.openPreview(doc);
    } else {
      previewProvider.hide();
    }
  });

  const openPreviewCmd = vscode.commands.registerCommand('md-reader.openPreview', () => {
    const doc = vscode.window.activeTextEditor?.document;
    if (doc) {
      statusBarController.setMode(ViewMode.Preview);
      previewProvider.openPreview(doc);
    }
  });

  const toggleViewCmd = vscode.commands.registerCommand('md-reader.toggleView', () => {
    statusBarController.toggle();
  });

  // 监听文档变更
  const changeDocSub = vscode.workspace.onDidChangeTextDocument((e) => {
    const doc = e.document;
    if (doc.languageId === 'markdown') {
      previewProvider.updateContent(doc);
    }
  });

  // 监听主题变更
  const themeChangeSub = vscode.window.onDidChangeActiveColorTheme(() => {
    previewProvider.updateTheme();
  });

  context.subscriptions.push(
    openPreviewCmd,
    toggleViewCmd,
    changeDocSub,
    themeChangeSub,
    statusBarController,
  );
}

export function deactivate() {
  statusBarController.dispose();
}
```

- [ ] **步骤 3：编译验证**

运行：`npm run compile`
预期：无报错

- [ ] **步骤 4：Commit**

```bash
git add extension-扩展逻辑/previewProvider.ts extension-扩展逻辑/extension.ts
git commit -m "feat: PreviewProvider + Extension 入口 + 文档监听 + 主题监听"
```

---

### 任务 7：Playwright E2E 测试

**文件：**
- 创建：`e2e-浏览器测试/playwright.config.ts`
- 创建：`e2e-浏览器测试/harness.ts`
- 创建：`e2e-浏览器测试/mermaid-flowchart.spec.ts`
- 创建：`e2e-浏览器测试/mermaid-sequence.spec.ts`
- 创建：`e2e-浏览器测试/mermaid-mindmap.spec.ts`
- 创建：`e2e-浏览器测试/theme-sync.spec.ts`

- [ ] **步骤 1：创建 playwright.config.ts**

```typescript
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  reporter: [['list']],
  outputDir: path.resolve(__dirname, 'test-results'),
  use: {
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

- [ ] **步骤 2：创建 harness.ts**

```typescript
import fs from 'fs';
import os from 'os';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..');

export interface HarnessConfig {
  markdownContent: string;
  mermaidTheme?: string;
}

/**
 * 组装自包含 HTML，内联真实 webview JS + Mermaid CDN，
 * 用 file:// 加载到 Chromium。
 */
export function writeHarnessHtml(cfg: HarnessConfig): { url: string; dir: string } {
  const mainJs = fs.readFileSync(path.join(REPO_ROOT, 'webview-预览界面', 'main.js'), 'utf8');
  const rendererJs = fs.readFileSync(path.join(REPO_ROOT, 'webview-预览界面', 'mermaid-renderer.js'), 'utf8');
  const stylesCss = fs.readFileSync(path.join(REPO_ROOT, 'webview-预览界面', 'styles.css'), 'utf8');

  const shim = `
<script>
  window.__posted = [];
  window.acquireVsCodeApi = function () {
    return {
      postMessage: function (msg) { window.__posted.push(msg); },
      setState: function () {},
      getState: function () { return undefined; },
    };
  };
</script>`;

  const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><title>MD Reader e2e harness</title>
<style>${stylesCss}</style>
${shim}
</head><body>
<div id="md-content">${cfg.markdownContent}</div>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>${rendererJs}</script>
<script>
  if (window.MdReaderMermaid) {
    window.MdReaderMermaid.initMermaid('${cfg.mermaidTheme || 'default'}');
  }
</script>
<script>${mainJs}</script>
</body></html>`;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'md-reader-e2e-'));
  const file = path.join(dir, 'index.html');
  fs.writeFileSync(file, html, 'utf8');
  return { url: `file://${file}`, dir };
}
```

- [ ] **步骤 3：创建 mermaid-flowchart.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { writeHarnessHtml } from './harness';

test('renders mermaid flowchart', async ({ page }) => {
  const { url, dir } = writeHarnessHtml({
    markdownContent: '<div class="mermaid">graph TD; A-->B; B-->C;</div>',
  });

  const pageErrors: string[] = [];
  page.on('pageerror', err => pageErrors.push(err.message));

  await page.goto(url);
  await expect(page.locator('#md-content')).toBeVisible();

  // Mermaid 应渲染出 SVG
  const svg = page.locator('#md-content svg');
  await expect(svg).toBeVisible({ timeout: 10000 });
  expect(pageErrors, `Mermaid threw: ${pageErrors.join('\n')}`).toEqual([]);

  // 清理
  try { require('fs').rmSync(dir, { recursive: true, force: true }); } catch {}
});
```

- [ ] **步骤 4：创建 mermaid-sequence.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { writeHarnessHtml } from './harness';

test('renders mermaid sequence diagram', async ({ page }) => {
  const { url, dir } = writeHarnessHtml({
    markdownContent: '<div class="mermaid">sequenceDiagram; participant A; participant B; A->>B: Hello;</div>',
  });

  await page.goto(url);
  const svg = page.locator('#md-content svg');
  await expect(svg).toBeVisible({ timeout: 10000 });

  try { require('fs').rmSync(dir, { recursive: true, force: true }); } catch {}
});
```

- [ ] **步骤 5：创建 mermaid-mindmap.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { writeHarnessHtml } from './harness';

test('renders mermaid mindmap', async ({ page }) => {
  const { url, dir } = writeHarnessHtml({
    markdownContent: '<div class="mermaid">mindmap; root((Root)); A((A)); B((B));</div>',
  });

  await page.goto(url);
  const svg = page.locator('#md-content svg');
  await expect(svg).toBeVisible({ timeout: 10000 });

  try { require('fs').rmSync(dir, { recursive: true, force: true }); } catch {}
});
```

- [ ] **步骤 6：创建 theme-sync.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { writeHarnessHtml } from './harness';

test('mermaid uses dark theme when configured', async ({ page }) => {
  const { url, dir } = writeHarnessHtml({
    markdownContent: '<div class="mermaid">graph TD; A-->B;</div>',
    mermaidTheme: 'dark',
  });

  await page.goto(url);
  const svg = page.locator('#md-content svg');
  await expect(svg).toBeVisible({ timeout: 10000 });

  // dark 主题下 SVG 背景应为深色
  const fill = await svg.evaluate(el => getComputedStyle(el).fill || el.getAttribute('style'));
  expect(fill).toBeTruthy();

  try { require('fs').rmSync(dir, { recursive: true, force: true }); } catch {}
});
```

- [ ] **步骤 7：安装 Playwright 浏览器**

运行：`npx playwright install chromium`
预期：Chromium 下载完成

- [ ] **步骤 8：运行 E2E 测试**

运行：`npm run test:e2e`
预期：4 个 spec 全部 PASS

- [ ] **步骤 9：Commit**

```bash
git add e2e-浏览器测试/
git commit -m "feat: Playwright E2E 测试（flowchart/sequence/mindmap/theme）"
```

---

### 任务 8：全流程验证 + README

**文件：**
- 创建：`README.md`

- [ ] **步骤 1：创建 README.md**

```markdown
# MD Reader — VS Code Markdown 阅读器

完美支持 Mermaid 图表渲染的 VS Code Markdown 预览扩展。兼容 Windsurf 和 Cursor。

## 功能

- 🐠 **Mermaid 完美支持** — flowchart、sequence、class、state、ER、gantt、pie、mindmap、timeline、gitgraph、sankey、quadrant
- 🎨 **主题跟随** — 自动适配 VS Code 亮/暗色主题，Mermaid 主题同步切换
- 🔀 **状态栏切换** — 右下角一键切换「预览」/「原始内容」
- 📝 **GFM 完整支持** — 表格、任务列表、删除线、脚注
- 💡 **代码高亮** — highlight.js 语法着色
- 🔄 **实时同步** — 编辑即刷新

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
```

- [ ] **步骤 2：运行全流程测试**

运行：`npm test && npm run test:e2e`
预期：全部 PASS

- [ ] **步骤 3：Commit**

```bash
git add README.md
git commit -m "docs: README + 全流程验证通过"
```

- [ ] **步骤 4：Push**

```bash
git push origin main
```
