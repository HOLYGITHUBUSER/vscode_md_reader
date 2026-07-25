import * as vscode from 'vscode';
import { renderMarkdown } from './markdownEngine.js';

export class PreviewProvider {
  private panel: vscode.WebviewPanel | undefined;
  private webview: vscode.Webview | undefined;

  constructor(private context: vscode.ExtensionContext) {}

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
            vscode.Uri.joinPath(this.context.extensionUri, '02-webview-预览界面'),
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
    const kind = vscode.window.activeColorTheme.kind;
    const dark = kind === vscode.ColorThemeKind.Dark || kind === vscode.ColorThemeKind.HighContrast;
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
    const base = vscode.Uri.joinPath(this.context.extensionUri, '02-webview-预览界面');
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(base, 'webview-styles.css'));
    const mainJsUri = webview.asWebviewUri(vscode.Uri.joinPath(base, 'webview-main.js'));
    const rendererUri = webview.asWebviewUri(vscode.Uri.joinPath(base, 'webview-mermaid-renderer.js'));
    const mermaidJsUri = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
    const cspSource = webview.cspSource;

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline' https:; script-src ${cspSource} https://cdn.jsdelivr.net; img-src ${cspSource} data: https:;">
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
