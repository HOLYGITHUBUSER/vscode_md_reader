"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const node_test_1 = require("node:test");
const markdownEngine_js_1 = require("../markdownEngine.js");
(0, node_test_1.describe)('extractMermaidBlocks', () => {
    (0, node_test_1.it)('extracts single mermaid block', () => {
        const md = 'Some text\n```mermaid\ngraph TD; A-->B;\n```\nMore text';
        const blocks = (0, markdownEngine_js_1.extractMermaidBlocks)(md);
        assert_1.default.strictEqual(blocks.length, 1);
        assert_1.default.strictEqual(blocks[0].code, 'graph TD; A-->B;');
        assert_1.default.strictEqual(blocks[0].index, 0);
    });
    (0, node_test_1.it)('extracts multiple mermaid blocks', () => {
        const md = '```mermaid\ngraph TD; A-->B;\n```\nText\n```mermaid\nsequenceDiagram; A->>B;\n```';
        const blocks = (0, markdownEngine_js_1.extractMermaidBlocks)(md);
        assert_1.default.strictEqual(blocks.length, 2);
        assert_1.default.strictEqual(blocks[0].code, 'graph TD; A-->B;');
        assert_1.default.strictEqual(blocks[1].code, 'sequenceDiagram; A->>B;');
    });
    (0, node_test_1.it)('ignores non-mermaid code blocks', () => {
        const md = '```js\nconsole.log("hi");\n```';
        const blocks = (0, markdownEngine_js_1.extractMermaidBlocks)(md);
        assert_1.default.strictEqual(blocks.length, 0);
    });
});
//# sourceMappingURL=mermaid-extract.test.js.map