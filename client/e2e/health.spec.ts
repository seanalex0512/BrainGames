import { test, expect } from '@playwright/test';

test('homepage shows BrainGames heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('BrainGames')).toBeVisible();
});

test('homepage shows server connected status', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Server connected')).toBeVisible({ timeout: 10_000 });
});
