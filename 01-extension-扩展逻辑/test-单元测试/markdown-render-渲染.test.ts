import assert from 'assert';
import { describe, it } from 'node:test';
import { renderMarkdown } from '../markdownEngine.js';

describe('markdownEngine renderMarkdown', () => {
  it('renders paragraphs', () => {
    const html = renderMarkdown('hello world');
    assert.ok(html.includes('<p>hello world</p>'));
  });

  it('renders GFM table', () => {
    const md = '| A | B |\n| --- | --- |\n| 1 | 2 |';
    const html = renderMarkdown(md);
    assert.ok(html.includes('<table>'));
    assert.ok(html.includes('<td>1</td>'));
  });

  it('renders task list', () => {
    const md = '- [x] done\n- [ ] todo';
    const html = renderMarkdown(md);
    assert.ok(html.includes('\u2611'));
    assert.ok(html.includes('\u2610'));
  });

  it('renders strikethrough', () => {
    const html = renderMarkdown('~~deleted~~');
    assert.ok(html.includes('<del>deleted</del>') || html.includes('<s>deleted</s>'));
  });

  it('preserves mermaid code block with language tag', () => {
    const md = '```mermaid\ngraph TD; A-->B;\n```';
    const html = renderMarkdown(md);
    assert.ok(html.includes('mermaid'));
    assert.ok(html.includes('graph TD; A-->B;'));
  });
});
