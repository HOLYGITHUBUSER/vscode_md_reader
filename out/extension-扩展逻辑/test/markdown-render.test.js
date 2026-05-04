"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const node_test_1 = require("node:test");
const markdownEngine_js_1 = require("../markdownEngine.js");
(0, node_test_1.describe)('markdownEngine renderMarkdown', () => {
    (0, node_test_1.it)('renders paragraphs', () => {
        const html = (0, markdownEngine_js_1.renderMarkdown)('hello world');
        assert_1.default.ok(html.includes('<p>hello world</p>'));
    });
    (0, node_test_1.it)('renders GFM table', () => {
        const md = '| A | B |\n| --- | --- |\n| 1 | 2 |';
        const html = (0, markdownEngine_js_1.renderMarkdown)(md);
        assert_1.default.ok(html.includes('<table>'));
        assert_1.default.ok(html.includes('<td>1</td>'));
    });
    (0, node_test_1.it)('renders task list', () => {
        const md = '- [x] done\n- [ ] todo';
        const html = (0, markdownEngine_js_1.renderMarkdown)(md);
        assert_1.default.ok(html.includes('\u2611'));
        assert_1.default.ok(html.includes('\u2610'));
    });
    (0, node_test_1.it)('renders strikethrough', () => {
        const html = (0, markdownEngine_js_1.renderMarkdown)('~~deleted~~');
        assert_1.default.ok(html.includes('<del>deleted</del>') || html.includes('<s>deleted</s>'));
    });
    (0, node_test_1.it)('preserves mermaid code block with language tag', () => {
        const md = '```mermaid\ngraph TD; A-->B;\n```';
        const html = (0, markdownEngine_js_1.renderMarkdown)(md);
        assert_1.default.ok(html.includes('mermaid'));
        assert_1.default.ok(html.includes('graph TD; A-->B;'));
    });
});
//# sourceMappingURL=markdown-render.test.js.map