import { test, expect } from '@playwright/test';
import { writeHarnessHtml } from './harness';
import fs from 'fs';

test('renders mermaid mindmap', async ({ page }) => {
  const { url, dir } = writeHarnessHtml({
    markdownContent: '<div class="mermaid">mindmap\n  root((Root))\n    A((A))\n    B((B))</div>',
  });

  await page.goto(url);
  const svg = page.locator('#md-content svg');
  await expect(svg).toBeVisible({ timeout: 15000 });

  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
});
