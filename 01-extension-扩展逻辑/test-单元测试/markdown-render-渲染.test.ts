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

  it('renders task list as disabled checkboxes', () => {
    const md = '- [x] done\n- [ ] todo';
    const html = renderMarkdown(md);
    assert.ok(html.includes('task-list-item-checkbox'), html);
    assert.ok(html.includes('checked'), html);
    assert.ok(html.includes('contains-task-list'), html);
    assert.ok(html.includes('done') && html.includes('todo'), html);
  });

  it('renders strikethrough', () => {
    const html = renderMarkdown('~~deleted~~');
    assert.ok(
      html.includes('<s>deleted</s>') ||
        html.includes('<del>deleted</del>') ||
        html.includes('>deleted</'),
      html
    );
  });

  it('preserves mermaid code block with language tag', () => {
    const md = '```mermaid\ngraph TD; A-->B;\n```';
    const html = renderMarkdown(md);
    assert.ok(html.includes('class="mermaid"'), html);
    // 箭头在 HTML 转义后为 --&gt;
    assert.ok(html.includes('graph TD; A--') && html.includes('B;'), html);
  });
});
