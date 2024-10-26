import { expect, test } from '../../fixtures/test/index.js';

test.describe('/apps/:appId', () => {
  test.beforeEach(async ({ login, page }) => {
    await login('/en/apps');
    await page.getByRole('link', { name: 'Person Appsemble' }).first().click();
    await page.waitForLoadState('domcontentloaded');
  });

  test('should prompt when user has unsaved changes', async ({ page }) => {
    await page.click('text=Editor');
    await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();
    await page.getByRole('code').getByText('Person', { exact: true }).dblclick();
    await page.getByRole('code').getByText('Person', { exact: true }).press('Backspace');
    await page.getByRole('code').getByText('name:').first().press('t+e+s+t');
    await expect(page.getByRole('button', { name: 'Publish' })).toBeEnabled();

    // TODO: could not get close or reload to work within this test.
    // page.close({ runBeforeUnload: true });
    // page.once('dialog', (dialog) => { dialog.dismiss(); }).reload();
    await page
      .once('dialog', (dialog) => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toBe('You have unsaved changes. Do you wish to continue?');
        dialog.dismiss();
      })
      .getByRole('link', { name: 'Details' })
      .click();
    await expect(page.getByText('Clone App')).toBeHidden();

    await page
      .once('dialog', (dialog) => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toBe('You have unsaved changes. Do you wish to continue?');
        dialog.accept();
      })
      .getByRole('link', { name: 'Details' })
      .click();
    await expect(page.getByText('Clone App')).toBeVisible();
  });

  test('should not prompt when user has saved their changes', async ({ page }) => {
    await page.click('text=Editor');
    await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();
    await page.getByRole('code').getByText('Person', { exact: true }).dblclick();
    await page.getByRole('code').getByText('Person', { exact: true }).press('Backspace');
    // Write out the same app name but add a new line. To avoid breaking the test on repeat.
    await page.getByRole('code').getByText('name:').first().press('P+e+r+s+o+n+Enter');
    await page.getByRole('button', { name: 'Publish' }).click();
    // The validation needs to catch up otherwise the dialog will still open.
    await page.waitForResponse('/api/apps/*');

    await page
      .once('dialog', (dialog) => {
        expect(dialog.message()).toBe('this should not be shown');
        expect(dialog.type()).toBe('this should not be shown');
      })
      .getByRole('link', { name: 'Details' })
      .click();
    await expect(page.getByText('Clone App')).toBeVisible();
  });

  test('should link to the asset viewer', async ({ page }) => {
    await page.click('text=Assets');
    await expect(page.getByText('Upload new asset')).toBeVisible();
  });

  test('should link to resources', async ({ page }) => {
    await page.click('text=Resources');
    await expect(page.getByText('This app has the following resources')).toBeVisible();
  });

  test('should link to a specific resource', async ({ page }) => {
    await page.click('text=Resources');
    await page.click('li :has-text("person")');
    await expect(page.getByText('Resource: person')).toBeVisible();
  });

  test('should link to the translator tool', async ({ page }) => {
    await page.click('text=Translations');
    await expect(page.getByText('Selected language')).toBeVisible();
  });

  test('should link to the notification sender', async ({ page }) => {
    await page.click('text=Notifications');
    await expect(
      page.getByText('Push notifications are currently not enabled in this app.'),
    ).toBeVisible();
  });

  test('should link to the snapshots page', async ({ page }) => {
    await page.click('text=Snapshots');
    await expect(page.getByText('Snapshots')).toBeVisible();
    await expect(
      page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Appsemble' }) }),
    ).toBeVisible();
  });

  test('should link to the app settings', async ({ page }) => {
    await page.click('text=Settings');
    await expect(page.getByText('App lock')).toBeVisible();
  });

  test('should link to the app secrets', async ({ page }) => {
    await page.click('text=Secrets');
    await expect(page.getByText('Appsemble Login')).toBeVisible();
  });
});
