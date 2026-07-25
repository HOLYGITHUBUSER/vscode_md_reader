// @ts-check
(function () {
  'use strict';

  /**
   * 初始化 Mermaid 并渲染页面中所有 .mermaid 元素。
   * @param {string} theme - 'default' | 'dark' | 'forest' | 'neutral'
   */
  async function initMermaid(theme) {
    if (typeof mermaid === 'undefined') {
      console.error('mermaid.js not loaded');
      return;
    }
    mermaid.initialize({
      startOnLoad: false,
      theme: theme || 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });
    await renderAllMermaid();
  }

  async function renderAllMermaid() {
    const elements = document.querySelectorAll('.mermaid');
    for (const el of elements) {
      if (el.getAttribute('data-processed')) continue;
      try {
        const id = 'mermaid-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        const result = await mermaid.render(id, el.textContent.trim());
        const container = document.createElement('div');
        container.className = 'mermaid-container';
        container.innerHTML = result.svg;
        container.style.cursor = 'zoom-in';
        container.addEventListener('click', function () {
          if (container.style.transform) {
            container.style.transform = '';
            container.style.cursor = 'zoom-in';
          } else {
            container.style.transform = 'scale(1.5)';
            container.style.transformOrigin = 'center top';
            container.style.cursor = 'zoom-out';
          }
        });
        el.replaceWith(container);
      } catch (err) {
        var errorDiv = document.createElement('div');
        errorDiv.className = 'mermaid-error';
        errorDiv.textContent = 'Mermaid 渲染错误: ' + (err.message || err);
        el.replaceWith(errorDiv);
      }
    }
  }

  window.MdReaderMermaid = { initMermaid: initMermaid, renderAllMermaid: renderAllMermaid };
})();
