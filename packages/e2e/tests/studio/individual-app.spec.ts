import { type Page } from '@playwright/test';

import { expect, test } from '../../index.js';

async function clickSideMenuItem(page: Page, title: string): Promise<void> {
  await page.getByTestId('studio-app-side-menu').getByRole('link', { name: title }).click();
}

test.describe('/apps/:appId', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/apps');
    await page.getByRole('link', { name: 'Person Appsemble' }).first().click();

    await expect(page.getByTestId('studio-app-side-menu-name')).toHaveText('Person');
  });

  test('should prompt when user has unsaved changes', async ({ page }) => {
    await clickSideMenuItem(page, 'Editor');
    page.on('dialog', (alert) => {
      expect(alert.type()).toBe('confirm');
      expect(alert.message()).toBe('You have unsaved changes. Do you wish to continue?');
      alert.dismiss();
    });

    await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();
    await page.getByRole('code').getByText('Person', { exact: true }).dblclick();
    await page.getByRole('code').getByText('Person', { exact: true }).press('Backspace');
    await page.getByRole('code').getByText('name:').first().press('t+e+s+t');
    await expect(page.getByRole('button', { name: 'Publish' })).toBeEnabled();

    await page.getByRole('link', { name: 'Details' }).click();

    await expect(page.getByText('Clone App')).toBeHidden();
  });

  test('should not prompt when user has saved their changes', async ({ page }) => {
    await clickSideMenuItem(page, 'Editor');
    await page.route('/api/apps/*', (route) => {
      route.fulfill({ path: 'mock-data/person-app-definition.json' });
    });
    page.on('dialog', (alert) => {
      // If a dialog comes up at all, the test should fail
      expect(alert).toBeNull();
    });

    await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();
    await page.getByRole('code').getByText('Person', { exact: true }).dblclick();
    await page.getByRole('code').getByText('Person', { exact: true }).press('Backspace');
    await page.getByRole('code').getByText('name:').first().press('P+e+r+s+o+n');

    await page.getByRole('button', { name: 'Publish' }).click();

    await expect(page.getByText('Successfully updated app definition')).toBeVisible();

    await page.getByRole('link', { name: 'Details' }).click();

    await expect(page.getByText('Clone App')).toBeVisible();
  });
});
