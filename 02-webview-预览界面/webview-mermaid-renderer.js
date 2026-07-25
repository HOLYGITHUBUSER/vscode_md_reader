// @ts-check
/**
 * Mermaid 渲染：默认对齐 Cursor / VS Code 暗色预览的简洁灰风格
 *（截图：深灰节点、浅灰描边与连线、浅灰文字、透明底）
 */
(function () {
  'use strict';

  /** Cursor Dark / VS Code 预览感：暗色 */
  var THEME_DARK = {
    darkMode: true,
    background: 'transparent',
    fontFamily: 'var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif)',
    fontSize: '14px',
    // 主节点
    primaryColor: '#2d2d2d',
    primaryTextColor: '#cccccc',
    primaryBorderColor: '#6e6e6e',
    // 次级
    secondaryColor: '#252526',
    secondaryTextColor: '#cccccc',
    secondaryBorderColor: '#6e6e6e',
    tertiaryColor: '#1e1e1e',
    tertiaryTextColor: '#cccccc',
    tertiaryBorderColor: '#555555',
    // 线 / 文字
    lineColor: '#858585',
    textColor: '#cccccc',
    mainBkg: '#2d2d2d',
    nodeBorder: '#6e6e6e',
    clusterBkg: '#252526',
    clusterBorder: '#555555',
    titleColor: '#cccccc',
    edgeLabelBackground: '#1e1e1e',
    // sequence
    actorBkg: '#2d2d2d',
    actorBorder: '#6e6e6e',
    actorTextColor: '#cccccc',
    actorLineColor: '#6e6e6e',
    signalColor: '#858585',
    signalTextColor: '#cccccc',
    labelBoxBkgColor: '#2d2d2d',
    labelBoxBorderColor: '#6e6e6e',
    labelTextColor: '#cccccc',
    loopTextColor: '#cccccc',
    noteBkgColor: '#252526',
    noteTextColor: '#cccccc',
    noteBorderColor: '#6e6e6e',
    activationBkgColor: '#3c3c3c',
    activationBorderColor: '#6e6e6e',
    sequenceNumberColor: '#1e1e1e',
    // class / state
    classText: '#cccccc',
    // pie / mindmap 等
    pie1: '#4a4a4a',
    pie2: '#5a5a5a',
    pie3: '#3a3a3a',
    pie4: '#6a6a6a',
    pie5: '#2a2a2a',
    pieTitleTextColor: '#cccccc',
    pieSectionTextColor: '#cccccc',
    pieLegendTextColor: '#cccccc',
  };

  /** 浅色简洁 */
  var THEME_LIGHT = {
    darkMode: false,
    background: 'transparent',
    fontFamily: 'var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif)',
    fontSize: '14px',
    primaryColor: '#f3f3f3',
    primaryTextColor: '#1f1f1f',
    primaryBorderColor: '#8a8a8a',
    secondaryColor: '#eaeaea',
    secondaryTextColor: '#1f1f1f',
    secondaryBorderColor: '#8a8a8a',
    tertiaryColor: '#ffffff',
    tertiaryTextColor: '#1f1f1f',
    tertiaryBorderColor: '#c0c0c0',
    lineColor: '#6e6e6e',
    textColor: '#1f1f1f',
    mainBkg: '#f3f3f3',
    nodeBorder: '#8a8a8a',
    clusterBkg: '#fafafa',
    clusterBorder: '#c0c0c0',
    titleColor: '#1f1f1f',
    edgeLabelBackground: '#ffffff',
    actorBkg: '#f3f3f3',
    actorBorder: '#8a8a8a',
    actorTextColor: '#1f1f1f',
    actorLineColor: '#8a8a8a',
    signalColor: '#6e6e6e',
    signalTextColor: '#1f1f1f',
    labelBoxBkgColor: '#f3f3f3',
    labelBoxBorderColor: '#8a8a8a',
    labelTextColor: '#1f1f1f',
    noteBkgColor: '#fff8e1',
    noteTextColor: '#1f1f1f',
    noteBorderColor: '#c0c0c0',
  };

  /**
   * @param {string} [theme]
   * auto/dark/vscode → 暗色简洁；default/light → 浅色简洁；
   * forest/neutral/base 走官方 theme 名
   */
  function resolveConfig(theme) {
    var t = (theme || 'auto').toLowerCase();
    if (t === 'auto' || t === 'dark' || t === 'vscode' || t === 'cursor') {
      return { theme: 'base', themeVariables: THEME_DARK, dark: true };
    }
    if (t === 'default' || t === 'light') {
      return { theme: 'base', themeVariables: THEME_LIGHT, dark: false };
    }
    if (t === 'neutral' || t === 'forest' || t === 'base') {
      // 官方皮肤；dark 编辑器下 neutral 仍可读
      return { theme: t, themeVariables: t === 'base' ? THEME_DARK : undefined, dark: t !== 'forest' };
    }
    // 未知值：暗色简洁兜底
    return { theme: 'base', themeVariables: THEME_DARK, dark: true };
  }

  function configureMermaid(theme) {
    if (typeof mermaid === 'undefined') {
      console.error('mermaid.js not loaded');
      return false;
    }
    var resolved = resolveConfig(theme);
    mermaid.initialize({
      startOnLoad: false,
      theme: resolved.theme,
      themeVariables: resolved.themeVariables,
      securityLevel: 'loose',
      fontFamily: resolved.themeVariables && resolved.themeVariables.fontFamily
        ? resolved.themeVariables.fontFamily
        : 'inherit',
      // 布局更接近 Cursor 预览
      flowchart: {
        curve: 'basis',
        padding: 12,
        htmlLabels: true,
        useMaxWidth: true,
        nodeSpacing: 40,
        rankSpacing: 40,
      },
      sequence: {
        useMaxWidth: true,
        actorMargin: 40,
        messageMargin: 30,
        mirrorActors: false,
        bottomMarginAdj: 4,
      },
      class: {
        useMaxWidth: true,
      },
      themeCSS: [
        /* 圆角节点、细描边，贴近截图 */
        '.node rect,.node circle,.node ellipse,.node polygon,.node path{stroke-width:1px !important;}',
        '.edgePath .path,.flowchart-link{stroke-width:1.25px !important;}',
        '.marker{fill:var(--md-fg-muted,#858585) !important;stroke:var(--md-fg-muted,#858585) !important;}',
        '.label,.nodeLabel,.edgeLabel{font-size:13px !important;}',
        '.actor{stroke-width:1px !important;}',
        '.messageLine0,.messageLine1{stroke-width:1.25px !important;}',
        '.loopLine{stroke-width:1px !important;}',
      ].join('\n'),
    });
    return true;
  }

  function applyTheme(theme) {
    configureMermaid(theme);
  }

  async function initMermaid(theme) {
    if (!configureMermaid(theme)) return;
    await renderAllMermaid();
  }

  async function renderAllMermaid() {
    if (typeof mermaid === 'undefined') return;

    var root = document.getElementById('md-content') || document.body;
    var elements = Array.from(root.querySelectorAll('.mermaid'));

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (!el || !el.isConnected) continue;
      if (el.getAttribute('data-processed') === 'true') continue;
      el.setAttribute('data-processed', 'true');

      try {
        var graph = (el.textContent || '').trim();
        if (!graph) continue;

        var id =
          'mermaid-' +
          Date.now() +
          '-' +
          i +
          '-' +
          Math.random().toString(36).slice(2, 8);

        var result = await mermaid.render(id, graph);
        if (!el.isConnected) continue;

        var container = document.createElement('div');
        container.className = 'mermaid-container';
        container.setAttribute('data-mermaid-source', '1');
        container.innerHTML = result.svg;
        // 去掉 mermaid 有时注入的巨大 error 图标样式干扰
        var svg = container.querySelector('svg');
        if (svg) {
          svg.style.maxWidth = '100%';
          svg.style.height = 'auto';
          svg.removeAttribute('height');
        }
        container.style.cursor = 'zoom-in';
        container.addEventListener(
          'click',
          (function (node) {
            return function () {
              if (node.classList.contains('is-zoomed')) {
                node.classList.remove('is-zoomed');
                node.style.transform = '';
                node.style.cursor = 'zoom-in';
              } else {
                node.classList.add('is-zoomed');
                node.style.transform = 'scale(1.35)';
                node.style.transformOrigin = 'center top';
                node.style.cursor = 'zoom-out';
              }
            };
          })(container)
        );
        el.replaceWith(container);
      } catch (err) {
        if (!el.isConnected) continue;
        var errorDiv = document.createElement('div');
        errorDiv.className = 'mermaid-error';
        errorDiv.textContent =
          'Mermaid 语法错误: ' + ((err && err.message) || String(err));
        try {
          el.replaceWith(errorDiv);
        } catch (_) {
          /* node already detached */
        }
      }
    }
  }

  window.MdReaderMermaid = {
    initMermaid: initMermaid,
    applyTheme: applyTheme,
    renderAllMermaid: renderAllMermaid,
    /** 供调试：当前暗色简洁变量 */
    THEME_DARK: THEME_DARK,
  };
})();
