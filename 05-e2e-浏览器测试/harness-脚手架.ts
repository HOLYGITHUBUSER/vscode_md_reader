import fs from 'fs';
import os from 'os';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..');

export interface HarnessConfig {
  markdownContent: string;
  mermaidTheme?: string;
}

/**
 * e2e 最小壳：仅 #md-content + mermaid。
 * webview-main.js 对缺失的 .md-tabs / #md-source 必须 null-safe，
 * 且不得在初始化时清空 #md-content。
 */
export function writeHarnessHtml(cfg: HarnessConfig): { url: string; dir: string } {
  const mainJs = fs.readFileSync(path.join(REPO_ROOT, '02-webview-预览界面', 'webview-main.js'), 'utf8');
  const rendererJs = fs.readFileSync(path.join(REPO_ROOT, '02-webview-预览界面', 'webview-mermaid-renderer.js'), 'utf8');
  const stylesCss = fs.readFileSync(path.join(REPO_ROOT, '02-webview-预览界面', 'webview-styles.css'), 'utf8');

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
