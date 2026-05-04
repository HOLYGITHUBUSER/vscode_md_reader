"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHarness = createHarness;
const jsdom_1 = require("jsdom");
function createHarness() {
    const dom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body><div id="md-content"></div></body></html>', { runScripts: 'dangerously', resources: 'usable' });
    const posted = [];
    dom.window.acquireVsCodeApi = () => ({
        postMessage: (msg) => posted.push(msg),
        setState: () => { },
        getState: () => undefined,
    });
    return { dom, posted, document: dom.window.document, window: dom.window };
}
//# sourceMappingURL=webview-harness.js.map