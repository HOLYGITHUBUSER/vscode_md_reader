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
