"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderMarkdown = renderMarkdown;
exports.extractMermaidBlocks = extractMermaidBlocks;
const markdown_it_1 = __importDefault(require("markdown-it"));
const md = new markdown_it_1.default({
    html: true,
    linkify: true,
    typographer: true,
    highlight: (str, lang) => {
        if (lang && lang.toLowerCase() === 'mermaid') {
            return `<div class="mermaid">${str}</div>`;
        }
        return '';
    },
});
// GFM task list 插件
md.use(taskListPlugin);
function taskListPlugin(md) {
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
function renderMarkdown(text) {
    return md.render(text);
}
function extractMermaidBlocks(text) {
    const regex = /```mermaid\n([\s\S]*?)```/g;
    const blocks = [];
    let match;
    let idx = 0;
    while ((match = regex.exec(text)) !== null) {
        blocks.push({ code: match[1].trim(), index: idx++ });
    }
    return blocks;
}
//# sourceMappingURL=markdownEngine.js.map