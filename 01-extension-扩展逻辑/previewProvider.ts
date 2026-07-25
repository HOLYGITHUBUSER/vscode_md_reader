import * as path from 'path';
import * as vscode from 'vscode';
import { renderMarkdown } from './markdownEngine.js';
import {
  EditorMode,
  parseViewMode,
  StatusBarController,
  ViewMode,
} from './statusBarController.js';

/**
 * 单文档 Custom Text Editor：同一界面顶部标签切换「源码 / 预览」全屏视图。
 */
export class PreviewProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = 'md-reader.editor';

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly statusBar: StatusBarController
  ) {}

  public static register(
    context: vscode.ExtensionContext,
    statusBar: StatusBarController
  ): vscode.Disposable {
    const provider = new PreviewProvider(context, statusBar);
    return vscode.window.registerCustomEditorProvider(PreviewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true },
      supportsMultipleEditorsPerDocument: false,
    });
  }

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    const docDir = vscode.Uri.file(path.dirname(document.uri.fsPath));
    const roots = [
      vscode.Uri.joinPath(this.context.extensionUri, '02-webview-预览界面'),
      docDir,
    ];
    const folder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (folder) roots.push(folder.uri);

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: roots,
    };

    const config = vscode.workspace.getConfiguration('md-reader');
    let mode: EditorMode = parseViewMode(
      config.get<string>('defaultView', 'preview'),
      ViewMode.Preview
    );
    this.statusBar.setMode(mode === 'source' ? ViewMode.Source : ViewMode.Preview, {
      silent: true,
    });

    webviewPanel.webview.html = this.getHtml(webviewPanel.webview, mode);

    /** 忽略紧随 webview 回写后的文档变更回环 */
    let ignoreDocEchoUntil = 0;
    /** sourceEdit 串行队列，避免全量 replace 竞态 */
    let editChain: Promise<void> = Promise.resolve();
    let pendingSource: string | null = null;

    const buildHtml = (source: string) =>
      rewriteLocalMediaUrls(renderMarkdown(source), document, webviewPanel.webview);

    const postDoc = () => {
      const source = document.getText();
      webviewPanel.webview.postMessage({
        type: 'updateDocument',
        source,
        html: buildHtml(source),
        mode,
      });
    };

    const postPreviewOnly = (source: string) => {
      webviewPanel.webview.postMessage({
        type: 'updatePreviewOnly',
        html: buildHtml(source),
      });
    };

    const postTheme = () => {
      const kind = vscode.window.activeColorTheme.kind;
      const dark =
        kind === vscode.ColorThemeKind.Dark || kind === vscode.ColorThemeKind.HighContrast;
      const cfgTheme = vscode.workspace
        .getConfiguration('md-reader')
        .get<string>('mermaidTheme', 'auto');
      // auto：暗色用 Cursor 简洁灰(dark)，亮色用 light；也可强制 cursor/neutral 等
      const mermaidTheme =
        !cfgTheme || cfgTheme === 'auto' ? (dark ? 'cursor' : 'light') : cfgTheme;
      const themeClass =
        kind === vscode.ColorThemeKind.HighContrast
          ? 'vscode-high-contrast'
          : kind === vscode.ColorThemeKind.HighContrastLight
            ? 'vscode-high-contrast-light'
            : dark
              ? 'vscode-dark'
              : 'vscode-light';
      webviewPanel.webview.postMessage({ type: 'updateTheme', mermaidTheme, themeClass });
      // 主题变了：用当前源码强制重绘预览（否则 Mermaid 已变成 svg 容器不会重渲）
      postPreviewOnly(document.getText());
    };

    const applyMode = (next: EditorMode) => {
      mode = next;
      webviewPanel.webview.postMessage({ type: 'setMode', mode });
    };

    const changeDocSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() !== document.uri.toString()) return;
      if (Date.now() < ignoreDocEchoUntil) return;
      postDoc();
    });

    const themeSub = vscode.window.onDidChangeActiveColorTheme(() => postTheme());

    const modeSub = this.statusBar.onModeChange((next) => {
      if (!webviewPanel.visible) return;
      const m: EditorMode = next === ViewMode.Source ? 'source' : 'preview';
      if (m === mode) return;
      applyMode(m);
    });

    const flushSourceEdit = async (source: string) => {
      if (source === document.getText()) return;
      ignoreDocEchoUntil = Date.now() + 400;
      const edit = new vscode.WorkspaceEdit();
      const full = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );
      edit.replace(document.uri, full, source);
      await vscode.workspace.applyEdit(edit);
      postPreviewOnly(source);
    };

    const enqueueSourceEdit = (source: string) => {
      pendingSource = source;
      editChain = editChain
        .then(async () => {
          const latest = pendingSource;
          pendingSource = null;
          if (latest == null) return;
          await flushSourceEdit(latest);
          // 队列期间又有新输入
          while (pendingSource != null) {
            const again = pendingSource;
            pendingSource = null;
            await flushSourceEdit(again);
          }
        })
        .catch(() => {
          /* keep chain alive */
        });
    };

    const msgSub = webviewPanel.webview.onDidReceiveMessage(async (msg) => {
      if (!msg || typeof msg.type !== 'string') return;
      switch (msg.type) {
        case 'webviewReady':
          postDoc();
          postTheme();
          break;
        case 'setMode': {
          const next = parseViewMode(
            msg.mode as string,
            mode === 'source' ? ViewMode.Source : ViewMode.Preview
          );
          mode = next === ViewMode.Source ? 'source' : 'preview';
          this.statusBar.syncFromWebview(mode);
          webviewPanel.webview.postMessage({ type: 'setMode', mode });
          break;
        }
        case 'sourceEdit': {
          if (typeof msg.source !== 'string') break;
          enqueueSourceEdit(msg.source);
          break;
        }
      }
    });

    const viewStateSub = webviewPanel.onDidChangeViewState((e) => {
      if (e.webviewPanel.active) {
        this.statusBar.syncFromWebview(mode);
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocSub.dispose();
      themeSub.dispose();
      modeSub.dispose();
      msgSub.dispose();
      viewStateSub.dispose();
    });
  }

  private getHtml(webview: vscode.Webview, initialMode: EditorMode): string {
    const base = vscode.Uri.joinPath(this.context.extensionUri, '02-webview-预览界面');
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(base, 'webview-styles.css'));
    const mainJsUri = webview.asWebviewUri(vscode.Uri.joinPath(base, 'webview-main.js'));
    const rendererUri = webview.asWebviewUri(
      vscode.Uri.joinPath(base, 'webview-mermaid-renderer.js')
    );
    const mermaidJsUri = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
    const cspSource = webview.cspSource;
    const mode = initialMode === 'source' ? 'source' : 'preview';
    const sourceActive = mode === 'source';
    const previewActive = mode === 'preview';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src ${cspSource} https://cdn.jsdelivr.net; img-src ${cspSource} data: https: http: blob:;">
  <link rel="stylesheet" href="${cssUri}">
</head>
<body class="md-shell" data-mode="${mode}">
  <nav class="md-tabs" role="tablist" aria-label="视图切换">
    <button type="button" class="md-tab${sourceActive ? ' is-active' : ''}" role="tab" data-mode="source" aria-selected="${sourceActive}" title="源码">源码</button>
    <button type="button" class="md-tab${previewActive ? ' is-active' : ''}" role="tab" data-mode="preview" aria-selected="${previewActive}" title="预览">预览</button>
  </nav>
  <main class="md-main">
    <textarea id="md-source" class="md-source" spellcheck="false" wrap="off" aria-label="Markdown 源码"${sourceActive ? '' : ' hidden'}></textarea>
    <div id="md-content" class="md-preview" role="tabpanel" aria-label="预览"${previewActive ? '' : ' hidden'}></div>
  </main>
  <script src="${mermaidJsUri}"></script>
  <script src="${rendererUri}"></script>
  <script src="${mainJsUri}"></script>
</body>
</html>`;
  }
}

/** 把相对路径图片改成 webview 可加载的 asWebviewUri */
export function rewriteLocalMediaUrls(
  html: string,
  document: vscode.TextDocument,
  webview: vscode.Webview
): string {
  const baseDir = path.dirname(document.uri.fsPath);
  return html.replace(
    /(<img\b[^>]*?\bsrc\s*=\s*)(["'])([^"']+)\2/gi,
    (full, prefix: string, quote: string, src: string) => {
      const s = src.trim();
      if (
        !s ||
        /^(https?:|data:|vscode-webview:|vscode-file:|blob:)/i.test(s) ||
        s.startsWith('//')
      ) {
        return full;
      }
      try {
        const abs = path.isAbsolute(s) ? s : path.normalize(path.join(baseDir, s));
        const uri = webview.asWebviewUri(vscode.Uri.file(abs));
        return `${prefix}${quote}${uri.toString()}${quote}`;
      } catch {
        return full;
      }
    }
  );
}
