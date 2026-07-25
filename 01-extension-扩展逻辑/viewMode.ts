/** 同一 Custom Editor 内顶部标签模式：全屏源码 / 全屏预览 */
export enum ViewMode {
  Source = 'source',
  Preview = 'preview',
}

export type EditorMode = 'source' | 'preview';

const CYCLE: ViewMode[] = [ViewMode.Source, ViewMode.Preview];

export function toggleView(current: ViewMode): ViewMode {
  const i = CYCLE.indexOf(current);
  return CYCLE[(i < 0 ? 0 : i + 1) % CYCLE.length];
}

export function getStatusBarText(mode: ViewMode): string {
  switch (mode) {
    case ViewMode.Source:
      return '$(code) 源码';
    case ViewMode.Preview:
    default:
      return '$(eye) 预览';
  }
}

export function parseViewMode(
  value: string | undefined,
  fallback: ViewMode = ViewMode.Preview
): ViewMode {
  if (value === ViewMode.Source || value === 'source') return ViewMode.Source;
  if (value === ViewMode.Preview || value === 'preview') return ViewMode.Preview;
  return fallback;
}
