import assert from 'assert';
import { describe, it } from 'node:test';
import { extractMermaidBlocks } from '../markdownEngine.js';

describe('extractMermaidBlocks', () => {
  it('extracts single mermaid block', () => {
    const md = 'Some text\n```mermaid\ngraph TD; A-->B;\n```\nMore text';
    const blocks = extractMermaidBlocks(md);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].code, 'graph TD; A-->B;');
    assert.strictEqual(blocks[0].index, 0);
  });

  it('extracts multiple mermaid blocks', () => {
    const md = '```mermaid\ngraph TD; A-->B;\n```\nText\n```mermaid\nsequenceDiagram; A->>B;\n```';
    const blocks = extractMermaidBlocks(md);
    assert.strictEqual(blocks.length, 2);
    assert.strictEqual(blocks[0].code, 'graph TD; A-->B;');
    assert.strictEqual(blocks[1].code, 'sequenceDiagram; A->>B;');
  });

  it('ignores non-mermaid code blocks', () => {
    const md = '```js\nconsole.log("hi");\n```';
    const blocks = extractMermaidBlocks(md);
    assert.strictEqual(blocks.length, 0);
  });
});
