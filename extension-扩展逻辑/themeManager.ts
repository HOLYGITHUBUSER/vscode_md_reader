const DARK_KEYWORDS = ['dark', 'black', 'night', 'one-dark', 'monokai', 'dracula', 'solarized-dark', 'high contrast'];

export function isDark(themeId: string): boolean {
  const lower = themeId.toLowerCase();
  return DARK_KEYWORDS.some(kw => lower.includes(kw));
}

export function getMermaidTheme(themeId: string): string {
  return isDark(themeId) ? 'dark' : 'default';
}

export function getCssVars(colors: Record<string, string>): string {
  return Object.entries(colors)
    .map(([key, value]) => `--vscode-${key}: ${value};`)
    .join('\n');
}
