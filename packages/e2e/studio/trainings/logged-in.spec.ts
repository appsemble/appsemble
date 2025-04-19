import { type TrainingStatus } from './constants.js';
import { expect, test } from '../../fixtures/index.js';

test.beforeEach(async ({ page, resetTrainingProgress }) => {
  await resetTrainingProgress();
  await page.goto('/en/trainings');
});

// We only have 1 account, so tests can influence each other
test.describe.configure({ mode: 'serial' });

test('should show the first chapter unlocked and the second one blocked', async ({ page }) => {
  const nodeStatus: { name: string; status: TrainingStatus }[] = [
    { name: 'rf__node-introduction', status: 'available' },
    { name: 'rf__node-what-is-appsemble', status: 'available' },
    { name: 'rf__node-get-familiar-with-the-studio', status: 'available' },
    { name: 'rf__node-how-to-create-an-app', status: 'blocked' },
    { name: 'rf__node-app-structure', status: 'blocked' },
    { name: 'rf__node-what-is-a-page', status: 'blocked' },
    { name: 'rf__node-what-is-a-block', status: 'blocked' },
    { name: 'rf__node-simple-app', status: 'blocked' },
  ];

  for (const { name, status } of nodeStatus) {
    await expect(page.getByTestId(name)).toHaveChapterStatus(status);
  }
});

test('should unlock next chapter once blocking chapter is completed', async ({ page }) => {
  await page.getByTestId('rf__node-what-is-appsemble').getByRole('link').click();
  await page.getByRole('button', { name: 'Click to complete' }).click();
  await page.getByRole('button', { name: 'To "Get familiar with the studio"' }).click();
  await page.getByRole('button', { name: 'Click to complete' }).click();
  await page.getByRole('button', { name: 'Back to tree' }).click();

  const nodeStatus: { name: string; status: TrainingStatus }[] = [
    { name: 'rf__node-introduction', status: 'completed' },
    { name: 'rf__node-what-is-appsemble', status: 'completed' },
    { name: 'rf__node-get-familiar-with-the-studio', status: 'completed' },
    { name: 'rf__node-how-to-create-an-app', status: 'available' },
    { name: 'rf__node-app-structure', status: 'available' },
    { name: 'rf__node-what-is-a-page', status: 'available' },
    { name: 'rf__node-what-is-a-block', status: 'available' },
    { name: 'rf__node-simple-app', status: 'available' },
  ];

  for (const { name, status } of nodeStatus) {
    await expect(page.getByTestId(name)).toHaveChapterStatus(status);
  }
});
