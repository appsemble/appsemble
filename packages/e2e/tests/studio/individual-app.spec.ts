import { expect, authenticatedTest as test } from '../../index.js';
import pkg from '../../package.json' with { type: 'json' };

let appId: number;

test.describe('Individual app', () => {
  test.beforeAll(async ({ createApp, createOrganization, randomTestId }) => {
    const organizationId = (await createOrganization({ id: randomTestId() })).id;

    appId = (
      await createApp(
        organizationId,
        `
          name: test app
          description: test app description
          defaultPage: Page 1
          pages:
            - name: Page 1
              blocks:
                - type: data-loader
                  version: ${pkg.version}
        `,
      )
    ).id!;
  });

  test.afterAll(async ({ deleteApp }) => {
    await deleteApp(appId);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/en/apps/${appId}`);
  });

  test('should prompt when user has unsaved changes', async ({ clickAppSideMenuItem, page }) => {
    await clickAppSideMenuItem('Editor');
    page.on('dialog', (alert) => {
      expect(alert.type()).toBe('confirm');
      expect(alert.message()).toBe('You have unsaved changes. Do you wish to continue?');
      alert.dismiss();
    });

    await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();
    const codeEditor = page.getByRole('code');
    await codeEditor.getByText('name: test app').click();
    await codeEditor.getByText('name: test app').press('End');
    await codeEditor.getByText('name: test app').press('Backspace');
    await codeEditor.getByText('name: test ap').press('p');
    await expect(page.getByRole('button', { name: 'Publish' })).toBeEnabled();

    await page.getByRole('link', { name: 'Details' }).click();

    await expect(page.getByText('Clone App')).toBeHidden();
  });

  test('should not prompt when user has saved their changes', async ({
    clickAppSideMenuItem,
    page,
  }) => {
    await clickAppSideMenuItem('Editor');
    page.on('dialog', (alert) => {
      expect(alert).toBeNull();
    });

    await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();
    const codeEditor = page.getByRole('code');
    await codeEditor.getByText('name: test app').click();
    await codeEditor.getByText('name: test app').press('End');
    await codeEditor.getByText('name: test app').press('Backspace');
    await codeEditor.getByText('name: test ap').press('p');

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/apps/') &&
        response.request().method() === 'PATCH' &&
        response.status() === 200,
    );
    await page.getByRole('button', { name: 'Publish' }).click();
    await responsePromise;
    await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();

    await page.getByRole('link', { name: 'Details' }).click();

    await expect(page.getByText('Clone App')).toBeVisible();
  });
});
