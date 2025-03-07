import { expect, test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/en/login?redirect=%2Fen%2Fapps');

  await page.getByTestId('email').fill(process.env.BOT_ACCOUNT_EMAIL);
  await page.getByTestId('password').fill(process.env.BOT_ACCOUNT_PASSWORD);
  await page.getByTestId('login').click();
  await page.waitForURL('**/apps');

  await expect(page.getByRole('heading', { name: 'My Apps', exact: true })).toBeVisible();

  await page.context().storageState({ path: '.auth/user.json' });
});
