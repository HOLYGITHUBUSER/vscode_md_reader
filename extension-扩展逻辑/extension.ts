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
