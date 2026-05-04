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

  const changeDocSub = vscode.workspace.onDidChangeTextDocument((e) => {
    const doc = e.document;
    if (doc.languageId === 'markdown') {
      previewProvider.updateContent(doc);
    }
  });

  const themeChangeSub = vscode.window.onDidChangeActiveColorTheme(() => {
    previewProvider.updateTheme();
  });

  // 自动打开预览：当 markdown 文件成为活动编辑器时
  const activeEditorSub = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor && editor.document.languageId === 'markdown') {
      const config = vscode.workspace.getConfiguration('md-reader');
      const defaultView = config.get<string>('defaultView', 'preview');
      if (defaultView === 'preview') {
        statusBarController.setMode(ViewMode.Preview);
        previewProvider.openPreview(editor.document);
      }
    }
  });

  // 首次激活时，如果当前已是 markdown 文件，也打开预览
  const activeDoc = vscode.window.activeTextEditor?.document;
  if (activeDoc && activeDoc.languageId === 'markdown') {
    const config = vscode.workspace.getConfiguration('md-reader');
    const defaultView = config.get<string>('defaultView', 'preview');
    if (defaultView === 'preview') {
      statusBarController.setMode(ViewMode.Preview);
      previewProvider.openPreview(activeDoc);
    }
  }

  context.subscriptions.push(
    openPreviewCmd,
    toggleViewCmd,
    changeDocSub,
    themeChangeSub,
    activeEditorSub,
    statusBarController,
  );
}

export function deactivate() {
  statusBarController.dispose();
}
