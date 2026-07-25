// @ts-check
/**
 * MD Reader Webview — 顶部标签切换「源码 | 预览」（全屏单面板，非左右分栏）。
 *
 * ── 期望 HTML 骨架（host / previewProvider 应对齐）──────────────────────────
 *
 * <body class="md-shell" data-mode="preview">
 *   <nav class="md-tabs" role="tablist" aria-label="视图切换">
 *     <button type="button" class="md-tab" role="tab"
 *             data-mode="source" aria-selected="false">源码</button>
 *     <button type="button" class="md-tab is-active" role="tab"
 *             data-mode="preview" aria-selected="true">预览</button>
 *   </nav>
 *   <main class="md-main">
 *     <textarea id="md-source" class="md-source" spellcheck="false"
 *               wrap="off" aria-label="Markdown 源码" hidden></textarea>
 *     <div id="md-content" class="md-preview" role="tabpanel"
 *          aria-label="预览"></div>
 *   </main>
 *   <!-- mermaid + webview-mermaid-renderer.js + webview-main.js -->
 * </body>
 *
 * 说明：
 * - 仅 source | preview 两个主标签；分栏不再作为主布局。
 * - e2e harness 可只含 #md-content（无 tabs / source），脚本必须 null-safe。
 *
 * ── Extension → Webview ────────────────────────────────────────────────────
 *   updateDocument   { source, html, mode? }   mode: 'source' | 'preview'
 *   setMode          { mode }
 *   updatePreviewOnly { html }
 *   updateTheme      { themeClass?, mermaidTheme? }
 *   updateContent    { html }                  // e2e / 旧兼容
 *   setLayout        { layout }                // 旧兼容 → 映射为 mode
 *
 * ── Webview → Extension ────────────────────────────────────────────────────
 *   webviewReady
 *   setMode          { mode }
 *   sourceEdit       { source }                // debounce ~180ms
 */
(function () {
  'use strict';

  var vscode =
    typeof acquireVsCodeApi === 'function'
      ? acquireVsCodeApi()
      : { postMessage: function () {}, setState: function () {}, getState: function () {} };

  var contentEl = document.getElementById('md-content');
  var sourceEl = document.getElementById('md-source');
  var tabsRoot = document.querySelector('.md-tabs');
  var tabButtons = document.querySelectorAll('.md-tabs [data-mode], .md-tab[data-mode], .md-mode-btn[data-mode], .md-mode-btn[data-layout]');

  /** @type {'source' | 'preview'} */
  var mode = 'preview';
  var sourceEditTimer = null;
  var applyingSource = false;

  /**
   * 规范化 mode：兼容旧 layout 名（split → preview）。
   * @param {string} raw
   * @returns {'source' | 'preview' | null}
   */
  function normalizeMode(raw) {
    if (raw === 'source') return 'source';
    if (raw === 'preview') return 'preview';
    // 旧分栏布局：默认展示预览全屏（不再做左右分栏主界面）
    if (raw === 'split') return 'preview';
    return null;
  }

  /**
   * 切换主面板可见性；只显示一个全高面板。
   * @param {string} next
   * @param {{ silent?: boolean }} [opts]
   */
  function setMode(next, opts) {
    var normalized = normalizeMode(next);
    if (!normalized) return;
    mode = normalized;
    opts = opts || {};

    document.body.setAttribute('data-mode', mode);
    // 兼容仍读 data-layout 的旧样式
    document.body.setAttribute('data-layout', mode);

    if (sourceEl) {
      if (mode === 'source') {
        sourceEl.hidden = false;
        sourceEl.removeAttribute('hidden');
        sourceEl.classList.add('is-visible');
        sourceEl.classList.remove('is-hidden');
      } else {
        sourceEl.hidden = true;
        sourceEl.setAttribute('hidden', '');
        sourceEl.classList.remove('is-visible');
        sourceEl.classList.add('is-hidden');
      }
    }

    if (contentEl) {
      if (mode === 'preview') {
        contentEl.hidden = false;
        contentEl.removeAttribute('hidden');
        contentEl.classList.add('is-visible');
        contentEl.classList.remove('is-hidden');
      } else {
        contentEl.hidden = true;
        contentEl.setAttribute('hidden', '');
        contentEl.classList.remove('is-visible');
        contentEl.classList.add('is-hidden');
      }
    }

    tabButtons.forEach(function (btn) {
      var btnMode = normalizeMode(
        btn.getAttribute('data-mode') || btn.getAttribute('data-layout') || ''
      );
      var on = btnMode === mode;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    if (tabsRoot) {
      tabsRoot.setAttribute('data-mode', mode);
    }

    if (!opts.silent) {
      // 新协议 + 旧 setLayout 兼容（host 尚未改时可收到其一）
      vscode.postMessage({ type: 'setMode', mode: mode });
    }
  }

  /**
   * @param {string} [html]
   */
  function renderPreview(html) {
    if (!contentEl) return;
    var scrollTop = contentEl.scrollTop;
    var scrollLeft = contentEl.scrollLeft;
    contentEl.innerHTML = html || '';
    var restore = function () {
      contentEl.scrollTop = scrollTop;
      contentEl.scrollLeft = scrollLeft;
    };
    var p =
      window.MdReaderMermaid && typeof window.MdReaderMermaid.renderAllMermaid === 'function'
        ? window.MdReaderMermaid.renderAllMermaid()
        : null;
    if (p && typeof p.then === 'function') {
      p.then(restore).catch(restore);
    } else {
      restore();
    }
  }

  /**
   * @param {string} [text]
   */
  function setSource(text) {
    if (!sourceEl) return;
    if (document.activeElement === sourceEl && !applyingSource) {
      if (sourceEl.value === (text || '')) return;
    }
    applyingSource = true;
    var start = sourceEl.selectionStart;
    var end = sourceEl.selectionEnd;
    var scrollTop = sourceEl.scrollTop;
    var scrollLeft = sourceEl.scrollLeft;
    sourceEl.value = text || '';
    try {
      if (document.activeElement === sourceEl && typeof start === 'number') {
        var len = sourceEl.value.length;
        sourceEl.selectionStart = Math.min(start, len);
        sourceEl.selectionEnd = Math.min(end, typeof end === 'number' ? end : start);
      }
      sourceEl.scrollTop = scrollTop;
      sourceEl.scrollLeft = scrollLeft;
    } catch (_) {
      /* ignore selection errors */
    }
    applyingSource = false;
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next =
        btn.getAttribute('data-mode') || btn.getAttribute('data-layout') || '';
      var normalized = normalizeMode(next);
      if (!normalized) return;
      setMode(normalized);
    });
  });

  if (sourceEl) {
    sourceEl.addEventListener('input', function () {
      if (applyingSource) return;
      if (sourceEditTimer) clearTimeout(sourceEditTimer);
      sourceEditTimer = setTimeout(function () {
        vscode.postMessage({ type: 'sourceEdit', source: sourceEl.value });
      }, 180);
    });
  }

  window.addEventListener('message', function (event) {
    var msg = event.data;
    if (!msg || !msg.type) return;
    switch (msg.type) {
      case 'updateDocument': {
        var docMode = msg.mode || msg.layout;
        if (docMode) setMode(docMode, { silent: true });
        setSource(msg.source || '');
        renderPreview(msg.html || '');
        break;
      }
      case 'setMode':
        if (msg.mode) setMode(msg.mode, { silent: true });
        break;
      case 'setLayout':
        // 旧协议
        if (msg.layout) setMode(msg.layout, { silent: true });
        break;
      case 'updatePreviewOnly':
        renderPreview(msg.html || '');
        break;
      case 'updateContent':
        // e2e harness / 旧消息
        renderPreview(msg.html || '');
        break;
      case 'updateTheme':
        if (msg.themeClass) {
          document.body.classList.remove(
            'vscode-dark',
            'vscode-light',
            'vscode-high-contrast',
            'vscode-high-contrast-light'
          );
          document.body.classList.add(msg.themeClass);
        }
        // 只改 mermaid 主题配置；完整重绘由 host 的 updatePreviewOnly 带新 HTML
        if (window.MdReaderMermaid) {
          if (typeof window.MdReaderMermaid.applyTheme === 'function') {
            window.MdReaderMermaid.applyTheme(msg.mermaidTheme);
          } else if (typeof window.MdReaderMermaid.initMermaid === 'function') {
            window.MdReaderMermaid.initMermaid(msg.mermaidTheme);
          }
        }
        break;
    }
  });

  // 初始：有 shell 时默认预览全屏；无 tabs/source 时（harness）不强制改 DOM
  if (tabsRoot || sourceEl || document.body.classList.contains('md-shell')) {
    var initial =
      document.body.getAttribute('data-mode') ||
      document.body.getAttribute('data-layout') ||
      'preview';
    setMode(initial, { silent: true });
  }

  try {
    vscode.postMessage({ type: 'webviewReady' });
  } catch (_) {
    /* harness / 非 VS Code 环境 */
  }
})();
