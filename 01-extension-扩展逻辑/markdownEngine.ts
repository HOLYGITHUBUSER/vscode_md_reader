import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
});

// Mermaid 代码块 → 可被 webview 渲染的容器（不要包在 <pre> 里）
md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const info = (token.info || '').trim().toLowerCase();
  if (info === 'mermaid') {
    return `<div class="mermaid">${escapeHtml(token.content.trim())}</div>\n`;
  }
  // 普通代码块：对齐 VS Code Preview 的 pre/code 结构
  const lang = (token.info || '').trim().split(/\s+/g)[0];
  const langClass = lang ? ` class="language-${escapeAttr(lang)}"` : '';
  return `<pre><code${langClass}>${escapeHtml(token.content)}</code></pre>\n`;
};

md.use(taskListPlugin);
md.use(strikethroughPlugin);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '');
}

/** GFM 风格任务列表 → 禁用态 checkbox（对齐内置 Preview） */
function taskListPlugin(mdInst: MarkdownIt): void {
  mdInst.core.ruler.after('inline', 'github-task-lists', (state) => {
    const tokens = state.tokens;
    for (let i = 2; i < tokens.length; i++) {
      if (
        tokens[i].type !== 'inline' ||
        tokens[i - 1].type !== 'paragraph_open' ||
        tokens[i - 2].type !== 'list_item_open'
      ) {
        continue;
      }
      const children = tokens[i].children;
      if (!children || children.length === 0) continue;

      let idx = 0;
      while (
        idx < children.length &&
        (children[idx].type === 'softbreak' ||
          (children[idx].type === 'text' && !children[idx].content.trim()))
      ) {
        idx++;
      }
      const first = children[idx];
      if (!first || first.type !== 'text') continue;

      const match = first.content.match(/^\[([ xX])\][ \t]+([\s\S]*)$/);
      if (!match) continue;

      const checked = match[1].toLowerCase() === 'x';
      tokens[i - 2].attrJoin('class', 'task-list-item');
      first.content = match[2];

      const checkbox = new state.Token('html_inline', '', 0);
      checkbox.content = `<input class="task-list-item-checkbox" type="checkbox" disabled${
        checked ? ' checked' : ''
      }>`;
      children.splice(idx, 0, checkbox);
    }

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'bullet_list_open') continue;
      let depth = 1;
      let hasTask = false;
      for (let j = i + 1; j < tokens.length && depth > 0; j++) {
        if (tokens[j].type === 'bullet_list_open') depth++;
        else if (tokens[j].type === 'bullet_list_close') depth--;
        else if (
          tokens[j].type === 'list_item_open' &&
          (tokens[j].attrGet('class') || '').includes('task-list-item')
        ) {
          hasTask = true;
        }
      }
      if (hasTask) tokens[i].attrJoin('class', 'contains-task-list');
    }
  });
}

/** ~~删除线~~ */
function strikethroughPlugin(mdInst: MarkdownIt): void {
  mdInst.inline.ruler.after('emphasis', 'strikethrough', (state, silent) => {
    const start = state.pos;
    if (state.src.slice(start, start + 2) !== '~~') return false;

    let end = -1;
    for (let i = start + 2; i < state.posMax - 1; i++) {
      if (state.src.slice(i, i + 2) === '~~') {
        end = i;
        break;
      }
    }
    if (end < 0) return false;
    if (silent) return true;

    const tokenOpen = state.push('s_open', 's', 1);
    tokenOpen.markup = '~~';
    const tokenText = state.push('text', '', 0);
    tokenText.content = state.src.slice(start + 2, end);
    const tokenClose = state.push('s_close', 's', -1);
    tokenClose.markup = '~~';

    state.pos = end + 2;
    return true;
  });
}

export function renderMarkdown(text: string): string {
  return md.render(text);
}

export interface MermaidBlock {
  code: string;
  index: number;
}

export function extractMermaidBlocks(text: string): MermaidBlock[] {
  const regex = /```mermaid\n([\s\S]*?)```/g;
  const blocks: MermaidBlock[] = [];
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({ code: match[1].trim(), index: idx++ });
  }
  return blocks;
}

