import { test } from '../fixtures/test/index.js';

test.describe('Holidays', () => {
  test.beforeEach(async ({ page, visitApp }) => {
    await page.route('/api/apps/*/actions/pages.0.tabs.0.blocks.0.actions.onLoad*', (route) => {
      route.fulfill({ path: 'fixtures/data/holidays-nl.json' });
    });
    await page.route('/api/apps/*/actions/pages.0.tabs.1.blocks.0.actions.onLoad*', (route) => {
      route.fulfill({ path: 'fixtures/data/holidays-de.json' });
    });
    await page.route('/api/apps/*/actions/pages.1.tabs.0.blocks.0.actions.onLoad*', (route) => {
      route.fulfill({ path: 'fixtures/data/holidays-us.json' });
    });

    visitApp('holidays');
  });

  test('should navigate to the second tab', async ({ page }) => {
    await page.waitForSelector('text=Eerste Kerstdag');
    await page.click('text=Germany');
    await page.waitForSelector('text=Mariä Himmelfahrt');
  });

  test('should navigate to the American holidays page', async ({ page }) => {
    await page.waitForSelector('text=Eerste Kerstdag');
    await page.click('text=Holidays in America');
    await page.waitForSelector('text=Independence Day');
  });
});
