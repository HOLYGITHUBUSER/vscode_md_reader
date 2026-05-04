import assert from 'assert';
import { describe, it } from 'node:test';
import { getMermaidTheme, getCssVars, isDark } from '../themeManager.js';

describe('themeManager', () => {
  it('returns dark mermaid theme for dark vscode theme', () => {
    assert.strictEqual(getMermaidTheme('one-dark-pro'), 'dark');
    assert.strictEqual(isDark('one-dark-pro'), true);
  });

  it('returns default mermaid theme for light vscode theme', () => {
    assert.strictEqual(getMermaidTheme('Default Light+'), 'default');
    assert.strictEqual(isDark('Default Light+'), false);
  });

  it('generates CSS vars from vscode colors', () => {
    const vars = getCssVars({
      'editor-background': '#1e1e1e',
      'editor-foreground': '#d4d4d4',
    });
    assert.ok(vars.includes('--vscode-editor-background: #1e1e1e'));
    assert.ok(vars.includes('--vscode-editor-foreground: #d4d4d4'));
  });
});
