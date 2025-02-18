import { expect, test } from '../fixtures/test/index.js';

test.describe('Trainings', () => {
  test('should render first chapter in training tree', async ({ page }) => {
    await page.goto('/en/trainings');
    await expect(page.getByTestId('rf__node-introduction')).toBeVisible();
  });
});
