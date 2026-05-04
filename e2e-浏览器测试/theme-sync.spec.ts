import { test, expect } from '@playwright/test';
import { writeHarnessHtml } from './harness';
import fs from 'fs';

test('mermaid uses dark theme when configured', async ({ page }) => {
  const { url, dir } = writeHarnessHtml({
    markdownContent: '<div class="mermaid">graph TD; A-->B;</div>',
    mermaidTheme: 'dark',
  });

  await page.goto(url);
  await page.waitForFunction(() => typeof (window as any).mermaid !== 'undefined', { timeout: 20000 });
  const svg = page.locator('#md-content svg');
  await expect(svg).toBeVisible({ timeout: 20000 });

  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
});
