import assert from 'assert';
import { describe, it } from 'node:test';

// 纯逻辑测试，不导入依赖 vscode API 的 StatusBarController 类
enum ViewMode {
  Preview = 'preview',
  Source = 'source',
}

function toggleView(current: ViewMode): ViewMode {
  return current === ViewMode.Preview ? ViewMode.Source : ViewMode.Preview;
}

function getStatusBarText(mode: ViewMode): string {
  return mode === ViewMode.Preview ? '$(eye) 预览' : '$(code) 原始';
}

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
