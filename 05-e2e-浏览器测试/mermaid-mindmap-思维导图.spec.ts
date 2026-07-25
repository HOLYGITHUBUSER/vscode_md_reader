import { test, expect } from '@playwright/test';
import { writeHarnessHtml } from './harness-脚手架';
import fs from 'fs';

test('renders mermaid mindmap', async ({ page }) => {
  const { url, dir } = writeHarnessHtml({
    markdownContent: `<div class="mermaid">mindmap
  root((Root))
    A((A))
    B((B))</div>`,
  });

  await page.goto(url);
  await page.waitForFunction(() => typeof (window as any).mermaid !== 'undefined', { timeout: 20000 });
  const svg = page.locator('#md-content svg');
  await expect(svg).toBeVisible({ timeout: 20000 });

  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
});
