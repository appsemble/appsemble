import { availableColor } from './constants.js';
import { expect, test } from '../../../fixtures/index.js';

test.beforeEach(async ({ page }) => {
  await page.goto('/en/trainings');
  await expect(
    page.getByLabel('Breadcrumbs').getByRole('listitem').filter({ hasText: 'Training' }),
  ).toBeVisible();
});

test.use({ storageState: { cookies: [], origins: [] } });

test('should render first chapter in training tree', async ({ page }) => {
  await expect(page.getByTestId('rf__node-introduction')).toBeVisible();
});

test('should show banner if user is not logged in', async ({ page }) => {
  await expect(
    page.getByText(
      'Warning: You are currently not logged in. While logged out you can access all trainings, but progress will not be saved',
    ),
  ).toBeVisible();
});

test('should have all trainings unlocked if user is not logged in', async ({ page }) => {
  // Wait for initialization since locator.all() does not wait for elements to be visible
  await page.getByTestId('rf__node-introduction').waitFor({ state: 'visible' });

  const statusCircles = await page.getByTestId('status-circle').all();
  expect(statusCircles.length).toBeGreaterThan(0);
  for (const statusCircle of statusCircles) {
    await expect(statusCircle).toHaveCSS('background-color', availableColor);
  }

  const blockedNodeTitles = await page.getByTestId('node-title-blocked').all();
  expect(blockedNodeTitles.length).toBe(0);
});

test('should navigate to training once the link is clicked', async ({ page }) => {
  await page.getByTestId('rf__node-what-is-appsemble').getByRole('link').click();

  await expect(page.getByRole('heading', { name: 'Appsemble Introduction ' })).toBeVisible();
});

test('should update training and chapter status once training is completed', async ({ page }) => {
  await page.getByTestId('rf__node-what-is-appsemble').getByRole('link').click();
  await page.getByRole('button', { name: 'Click to complete' }).click();
  await page.getByRole('button', { name: 'Back to tree' }).click();

  await expect(page.getByTestId('rf__node-introduction')).toHaveChapterStatus('in progress');
  await expect(page.getByTestId('rf__node-what-is-appsemble')).toHaveChapterStatus('completed');
});

test('should allow user to click through chapter trainings', async ({ page }) => {
  await page.getByTestId('rf__node-what-is-appsemble').getByRole('link').click();
  await page.getByRole('button', { name: 'Click to complete' }).click();
  await page.getByRole('button', { name: 'To "Get familiar with the studio"' }).click();

  await expect(page.getByRole('heading', { name: 'Get familiar with the studio' })).toBeVisible();
});
