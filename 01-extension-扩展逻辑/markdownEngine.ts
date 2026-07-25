import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str: string, lang: string): string => {
    if (lang && lang.toLowerCase() === 'mermaid') {
      return `<div class="mermaid">${str}</div>`;
    }
    return '';
  },
});

// GFM task list 插件
md.use(taskListPlugin);

function taskListPlugin(md: MarkdownIt): void {
  md.core.ruler.after('inline', 'task-lists', (state) => {
    for (const token of state.tokens) {
      if (token.type === 'inline' && token.children) {
        for (const child of token.children) {
          if (child.type === 'text') {
            child.content = child.content
              .replace(/\[x\]/gi, '\u2611')
              .replace(/\[ \]/g, '\u2610');
          }
        }
      }
    }
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
