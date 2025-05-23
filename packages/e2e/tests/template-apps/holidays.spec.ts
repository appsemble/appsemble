import { expect, test } from '../../index.js';

test.describe('Holidays', () => {
  test.beforeEach(async ({ page, visitApp }) => {
    await page.route('/api/apps/*/actions/pages.0.tabs.0.blocks.0.actions.onLoad*', (route) => {
      route.fulfill({ path: 'mock-data/holidays-nl.json' });
    });
    await page.route('/api/apps/*/actions/pages.0.tabs.1.blocks.0.actions.onLoad*', (route) => {
      route.fulfill({ path: 'mock-data/holidays-de.json' });
    });
    await page.route('/api/apps/*/actions/pages.1.tabs.0.blocks.0.actions.onLoad*', (route) => {
      route.fulfill({ path: 'mock-data/holidays-us.json' });
    });

    await visitApp('holidays');
    await page.waitForURL('**/holidays-in-europe/netherlands');
  });

  test('should navigate to the second tab', async ({ page }) => {
    await page.click('text=Germany');
    await expect(page.getByText('Mariä Himmelfahrt')).toBeVisible();
  });

  test('should navigate to the American holidays page', async ({ page }) => {
    await page.click('text=Holidays in America');
    await expect(page.getByText('Independence Day')).toBeVisible();
  });
});
