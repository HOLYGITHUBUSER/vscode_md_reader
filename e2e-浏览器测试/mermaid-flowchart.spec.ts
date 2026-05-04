import { test, expect } from '@playwright/test';
import { writeHarnessHtml } from './harness';
import fs from 'fs';

test('renders mermaid flowchart', async ({ page }) => {
  const { url, dir } = writeHarnessHtml({
    markdownContent: '<div class="mermaid">graph TD; A-->B; B-->C;</div>',
  });

  const pageErrors: string[] = [];
  page.on('pageerror', err => pageErrors.push(err.message));

  await page.goto(url);
  await page.waitForFunction(() => typeof (window as any).mermaid !== 'undefined', { timeout: 20000 });
  const svg = page.locator('#md-content svg');
  await expect(svg).toBeVisible({ timeout: 20000 });
  expect(pageErrors, `Mermaid threw: ${pageErrors.join('\n')}`).toEqual([]);

  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
});
