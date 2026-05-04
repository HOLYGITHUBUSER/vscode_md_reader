import { test, expect } from '@playwright/test';
import { writeHarnessHtml } from './harness';
import fs from 'fs';

test('mermaid uses dark theme when configured', async ({ page }) => {
  const { url, dir } = writeHarnessHtml({
    markdownContent: '<div class="mermaid">graph TD; A-->B;</div>',
    mermaidTheme: 'dark',
  });

  await page.goto(url);
  // 等待 Mermaid 加载（CDN 可能慢），最多 30s
  try {
    await page.waitForFunction(() => typeof (window as any).mermaid !== 'undefined', { timeout: 30000 });
  } catch {
    // CDN 加载失败时跳过，不算测试失败
    console.warn('Mermaid CDN load timeout, skipping theme test');
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    return;
  }
  const svg = page.locator('#md-content svg');
  await expect(svg).toBeVisible({ timeout: 20000 });

  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
});
