// @ts-check
(function () {
  'use strict';

  var vscode = acquireVsCodeApi();
  var contentEl = document.getElementById('md-content');

  window.addEventListener('message', function (event) {
    var msg = event.data;
    switch (msg.type) {
      case 'updateContent':
        contentEl.innerHTML = msg.html;
        if (window.MdReaderMermaid) {
          window.MdReaderMermaid.renderAllMermaid();
        }
        break;
      case 'updateTheme':
        if (window.MdReaderMermaid) {
          window.MdReaderMermaid.initMermaid(msg.mermaidTheme);
        }
        break;
    }
  });

  vscode.postMessage({ type: 'webviewReady' });
})();
