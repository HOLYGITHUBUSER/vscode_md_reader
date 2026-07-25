import assert from 'assert';
import { describe, it } from 'node:test';
import {
  getStatusBarText,
  parseViewMode,
  toggleView,
  ViewMode,
} from '../viewMode.js';

describe('statusBarController logic', () => {
  it('cycles source → preview → source', () => {
    assert.strictEqual(toggleView(ViewMode.Source), ViewMode.Preview);
    assert.strictEqual(toggleView(ViewMode.Preview), ViewMode.Source);
  });

  it('returns correct status bar text', () => {
    assert.strictEqual(getStatusBarText(ViewMode.Source), '$(code) 源码');
    assert.strictEqual(getStatusBarText(ViewMode.Preview), '$(eye) 预览');
  });

  it('parseViewMode accepts source/preview and falls back', () => {
    assert.strictEqual(parseViewMode('source'), ViewMode.Source);
    assert.strictEqual(parseViewMode('preview'), ViewMode.Preview);
    assert.strictEqual(parseViewMode('split', ViewMode.Preview), ViewMode.Preview);
    assert.strictEqual(parseViewMode(undefined, ViewMode.Source), ViewMode.Source);
  });
});
