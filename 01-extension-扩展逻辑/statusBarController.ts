import * as vscode from 'vscode';
import {
  EditorMode,
  getStatusBarText,
  parseViewMode,
  toggleView,
  ViewMode,
} from './viewMode.js';

export {
  EditorMode,
  getStatusBarText,
  parseViewMode,
  toggleView,
  ViewMode,
} from './viewMode.js';

type ModeListener = (mode: ViewMode) => void;

/**
 * 状态栏展示当前标签模式；点击循环 source ↔ preview。
 * 模式变更通过 onModeChange 通知 Custom Editor。
 */
export class StatusBarController implements vscode.Disposable {
  private item: vscode.StatusBarItem;
  private currentMode: ViewMode;
  private readonly listeners = new Set<ModeListener>();

  constructor(initial: ViewMode = ViewMode.Preview) {
    this.currentMode = initial;
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = 'md-editor.toggleView';
    this.updateDisplay();
    this.item.show();
  }

  private updateDisplay(): void {
    this.item.text = getStatusBarText(this.currentMode);
    this.item.tooltip = '点击切换：源码 ↔ 预览（同一界面标签）';
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentMode);
      } catch {
        // ignore listener errors
      }
    }
  }

  /** 状态栏 / 命令切换后通知打开中的阅读器 */
  onModeChange(listener: ModeListener): vscode.Disposable {
    this.listeners.add(listener);
    return {
      dispose: () => {
        this.listeners.delete(listener);
      },
    };
  }

  toggle(): ViewMode {
    this.currentMode = toggleView(this.currentMode);
    this.updateDisplay();
    this.notify();
    return this.currentMode;
  }

  getMode(): ViewMode {
    return this.currentMode;
  }

  setMode(mode: ViewMode, opts?: { silent?: boolean }): void {
    this.currentMode = mode;
    this.updateDisplay();
    if (!opts?.silent) {
      this.notify();
    }
  }

  /** webview 顶部标签切换时仅同步状态栏文案，避免回环 */
  syncFromWebview(mode: EditorMode | string): void {
    this.currentMode = parseViewMode(mode, this.currentMode);
    this.updateDisplay();
  }

  dispose(): void {
    this.listeners.clear();
    this.item.dispose();
  }
}
