import * as vscode from 'vscode';
import { PreviewProvider } from './previewProvider.js';
import {
  parseViewMode,
  StatusBarController,
  ViewMode,
} from './statusBarController.js';

const VIEW_TYPE = PreviewProvider.viewType;
const MD_GLOBS = ['*.md', '*.markdown'] as const;

let statusBarController: StatusBarController;
const reopening = new Set<string>();

export async function activate(context: vscode.ExtensionContext) {
  const defaultMode = parseViewMode(
    vscode.workspace.getConfiguration('md-reader').get<string>('defaultView', 'preview'),
    ViewMode.Preview
  );
  statusBarController = new StatusBarController(defaultMode);

  context.subscriptions.push(PreviewProvider.register(context, statusBarController));

  await syncEditorAssociations();

  const openReaderCmd = vscode.commands.registerCommand('md-reader.openPreview', async () => {
    const doc = await resolveMarkdownDocument();
    if (!doc) {
      void vscode.window.showInformationMessage('请先打开一个 Markdown 文件');
      return;
    }
    await openWithReader(doc.uri);
  });

  const toggleViewCmd = vscode.commands.registerCommand('md-reader.toggleView', () => {
    statusBarController.toggle();
  });

  const tabSub = vscode.window.tabGroups.onDidChangeTabs(async (e) => {
    if (!isAutoEnabled()) return;
    // 只处理新打开的文本标签，避免与用户「Open With 文本」对抗
    for (const tab of e.opened) {
      await maybeReopenTextTabAsReader(tab);
    }
  });

  if (isAutoEnabled()) {
    for (const group of vscode.window.tabGroups.all) {
      for (const tab of group.tabs) {
        void maybeReopenTextTabAsReader(tab);
      }
    }
  }

  const cfgSub = vscode.workspace.onDidChangeConfiguration(async (e) => {
    if (e.affectsConfiguration('md-reader.autoOpenReader')) {
      await syncEditorAssociations();
    }
  });

  context.subscriptions.push(openReaderCmd, toggleViewCmd, tabSub, cfgSub, statusBarController);
}

/** 按 autoOpenReader 写入或清理全局 editorAssociations */
async function syncEditorAssociations(): Promise<void> {
  const config = vscode.workspace.getConfiguration('workbench');
  const current = {
    ...(config.get<Record<string, string>>('editorAssociations') ?? {}),
  };
  let changed = false;

  if (isAutoEnabled()) {
    for (const g of MD_GLOBS) {
      if (current[g] !== VIEW_TYPE) {
        current[g] = VIEW_TYPE;
        changed = true;
      }
    }
  } else {
    for (const g of MD_GLOBS) {
      if (current[g] === VIEW_TYPE) {
        delete current[g];
        changed = true;
      }
    }
  }
  if (!changed) return;

  try {
    await config.update('editorAssociations', current, vscode.ConfigurationTarget.Global);
  } catch {
    try {
      await config.update('editorAssociations', current, vscode.ConfigurationTarget.Workspace);
    } catch {
      // ignore
    }
  }
}

function isAutoEnabled(): boolean {
  return (
    vscode.workspace.getConfiguration('md-reader').get<boolean>('autoOpenReader', true) !== false
  );
}

function isMarkdownUri(uri: vscode.Uri): boolean {
  const f = uri.fsPath.toLowerCase();
  return f.endsWith('.md') || f.endsWith('.markdown');
}

function isOpenAsMdReader(uri: vscode.Uri): boolean {
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      const input = tab.input;
      if (
        input instanceof vscode.TabInputCustom &&
        input.viewType === VIEW_TYPE &&
        input.uri.toString() === uri.toString()
      ) {
        return true;
      }
    }
  }
  return false;
}

async function maybeReopenTextTabAsReader(tab: vscode.Tab): Promise<void> {
  const input = tab.input;
  if (!(input instanceof vscode.TabInputText)) return;
  if (!isMarkdownUri(input.uri)) return;
  if (isOpenAsMdReader(input.uri)) return;

  const key = input.uri.toString();
  if (reopening.has(key)) return;
  reopening.add(key);
  try {
    await openWithReader(input.uri, tab.group.viewColumn);
  } finally {
    setTimeout(() => reopening.delete(key), 800);
  }
}

async function openWithReader(uri: vscode.Uri, column?: vscode.ViewColumn): Promise<void> {
  await vscode.commands.executeCommand(
    'vscode.openWith',
    uri,
    VIEW_TYPE,
    column ?? vscode.ViewColumn.Active
  );
}

async function resolveMarkdownDocument(): Promise<vscode.TextDocument | undefined> {
  const active = vscode.window.activeTextEditor?.document;
  if (active && isMarkdownDoc(active)) return active;
  for (const e of vscode.window.visibleTextEditors) {
    if (isMarkdownDoc(e.document)) return e.document;
  }
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      const input = tab.input;
      if (input instanceof vscode.TabInputCustom && input.viewType === VIEW_TYPE) {
        try {
          return await vscode.workspace.openTextDocument(input.uri);
        } catch {
          // continue
        }
      }
      if (input instanceof vscode.TabInputText && isMarkdownUri(input.uri)) {
        try {
          return await vscode.workspace.openTextDocument(input.uri);
        } catch {
          // continue
        }
      }
    }
  }
  return undefined;
}

function isMarkdownDoc(doc: vscode.TextDocument): boolean {
  return (
    doc.languageId === 'markdown' ||
    doc.fileName.endsWith('.md') ||
    doc.fileName.endsWith('.markdown')
  );
}

export function deactivate() {
  statusBarController?.dispose();
}
