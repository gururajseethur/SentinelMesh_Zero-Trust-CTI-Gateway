import { expect, test } from '@playwright/test';

test('overview loads with KPI cards and simulation badge', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('SENTINELMESH_COMMAND_CENTER')).toBeVisible();
  await expect(page.getByText('Shared Indicators')).toBeVisible();
  await expect(page.getByRole('main').getByText('Simulation Mode')).toBeVisible();
});

test('sidebar navigation opens primary modules', async ({ page }) => {
  await page.goto('/');
  await page.getByTitle('MISP Ingestion').click();
  await expect(page.getByText('MISP_INTEL_MATRIX')).toBeVisible();
  await page.getByTitle('TheHive Cases').click();
  await expect(page.getByText('THE_HIVE_OPERATIONS')).toBeVisible();
  await page.getByTitle('Automation').click();
  await expect(page.getByText('AUTOMATION_CONTROL')).toBeVisible();
});

test('unknown routes render 404', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page.getByText('404')).toBeVisible();
});
