import { expect, test } from '../../../index.js';

const organizationId = 'appsemble';

let appCollectionName: string | undefined;

test.describe('App Collections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/en/organizations/${organizationId}/collections`);
  });

  test.afterEach(async ({ deleteAppCollection }) => {
    if (appCollectionName !== undefined) {
      await deleteAppCollection(organizationId, appCollectionName);
    }
  });

  test('should create an app collection', async ({ browserName, createAppCollection, page }) => {
    appCollectionName = `Create test ${browserName.slice(0, 8)}`;
    await page.route('/test-assets/side.png', (route) => {
      route.fulfill({ path: 'mock-data/tux.png' });
    });
    await createAppCollection(
      organizationId,
      appCollectionName,
      'John Doe',
      'Lorem ipsum\n\n**text in bold**\n\n![side image](/test-assets/side.png)',
      'mock-data/retail.png',
      'mock-data/tux.png',
      false,
    );

    await page.getByRole('link', { name: appCollectionName }).click();

    await expect(page.getByLabel('Breadcrumbs').locator('li:nth-child(2)')).toHaveText(
      appCollectionName,
    );
    await expect(
      page.locator('header.has-background-primary.is-flex.is-flex-wrap-wrap'),
    ).toHaveScreenshot({
      timeout: 5000,
      maxDiffPixelRatio: 0.02,
    });

    await page.getByRole('link', { name: 'Expert' }).click();

    await page.getByRole('img', { name: 'side image' }).waitFor({ state: 'visible' });

    // TODO: Make sure this doesn't die in CI
    await expect(page.locator('section:has(div)')).toHaveScreenshot({
      timeout: 5000,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('should create a private app collection', async ({
    browser,
    browserName,
    createAppCollection,
    page,
  }) => {
    appCollectionName = `Private test ${browserName.slice(0, 8)}`;
    await createAppCollection(
      organizationId,
      appCollectionName,
      'John Doe',
      'Lorem ipsum',
      'mock-data/retail.png',
      'mock-data/tux.png',
      true,
    );

    await page.goto('/en/collections');
    await page.getByRole('heading', { name: 'App collections' }).waitFor({ state: 'visible' });
    await expect(page.getByRole('link', { name: appCollectionName })).toBeVisible({
      timeout: 5000,
    });

    const loggedOutPage = await browser.newPage({ storageState: undefined });
    await loggedOutPage.goto('/en/collections');
    await loggedOutPage
      .getByRole('heading', { name: 'App collections' })
      .waitFor({ state: 'visible' });
    await expect(loggedOutPage.getByRole('link', { name: appCollectionName })).toBeHidden({
      timeout: 5000,
    });
  });

  test('should edit an app collection', async ({ browserName, createAppCollection, page }) => {
    appCollectionName = `Edit test ${browserName.slice(0, 8)}`;
    await createAppCollection(
      organizationId,
      appCollectionName,
      'John Doe',
      'Lorem ipsum',
      'mock-data/retail.png',
      'mock-data/tux.png',
      false,
    );

    await page.getByRole('link', { name: appCollectionName }).click();
    await page.getByRole('link', { name: 'Settings' }).click();

    const oldName = appCollectionName;
    appCollectionName = appCollectionName.split('').reverse().join('');
    await page.getByLabel('Name', { exact: true }).fill(appCollectionName);
    await page.getByLabel('Expert name').fill('Jane Doe');
    await page.getByLabel('Expert description').fill('Hello world');
    await page.getByRole('button', { name: 'Save' }).click();

    await page.getByRole('link', { name: /Apps$/ }).click();

    await expect(page.getByRole('heading', { name: oldName })).toBeHidden();
    await expect(page.getByRole('heading', { name: appCollectionName })).toBeVisible();

    await page.getByRole('link', { name: 'Expert Jane Doe' }).click();
    await expect(page.locator('h1').filter({ hasText: 'Jane Doe' })).toBeVisible();
  });

  test('should delete an app collection', async ({ browserName, createAppCollection, page }) => {
    appCollectionName = `Delete test ${browserName.slice(0, 8)}`;
    await createAppCollection(
      organizationId,
      appCollectionName,
      'John Doe',
      'Lorem ipsum',
      'mock-data/retail.png',
      'mock-data/tux.png',
      false,
    );
    await page.getByRole('link', { name: `${appCollectionName} John Doe` }).click();
    await page.getByRole('link', { name: 'Settings' }).click();

    await page.getByRole('button', { name: 'Delete app collection' }).click();
    await page.getByRole('button', { name: 'Delete app collection', exact: true }).click();

    await page.getByRole('heading', { name: 'App collections' }).waitFor({ state: 'visible' });
    await expect(page.getByRole('link', { name: appCollectionName })).toBeHidden({
      timeout: 5000,
    });
    // Set to undefined so the afterEach doesn't try to delete a non-existent collection
    appCollectionName = undefined;
  });

  test('should add an app to an app collection', async ({
    browserName,
    createAppCollection,
    page,
  }) => {
    appCollectionName = `Add app test ${browserName.slice(0, 8)}`;
    await createAppCollection(
      organizationId,
      appCollectionName,
      'John Doe',
      'Lorem ipsum',
      'mock-data/retail.png',
      'mock-data/tux.png',
      false,
    );

    await page.getByRole('link', { name: 'App store' }).click();
    await page.getByRole('link', { name: 'Empty' }).first().click();
    await page.click('#app-options-menu');
    await page.getByRole('button', { name: 'Add to collection' }).click();
    await page.locator('#collectionId').selectOption({ label: appCollectionName });
    await page
      .locator('.modal-card-foot')
      .getByRole('button', { name: 'Add to collection' })
      .click();

    await page.goto('/en/collections');
    await page.getByRole('link', { name: appCollectionName }).click();

    await expect(page.getByRole('link', { name: 'Empty' })).toBeVisible();
  });

  test('should remove an app from an app collection', async ({
    browserName,
    createAppCollection,
    page,
  }) => {
    appCollectionName = `Rm app test ${browserName.slice(0, 8)}`;
    await createAppCollection(
      organizationId,
      appCollectionName,
      'John Doe',
      'Lorem ipsum',
      'mock-data/retail.png',
      'mock-data/tux.png',
      false,
    );

    await page.getByRole('link', { name: 'App store' }).click();
    await page.getByRole('link', { name: 'Empty' }).first().click();
    await page.click('#app-options-menu');
    await page.getByRole('button', { name: 'Add to collection' }).click();
    await page.locator('#collectionId').selectOption({ label: appCollectionName });
    await page
      .locator('.modal-card-foot')
      .getByRole('button', { name: 'Add to collection' })
      .click();

    await page.goto('/en/collections');
    await page.getByRole('link', { name: appCollectionName }).click();
    await page.getByRole('button', { name: 'Edit' }).click();
    await page
      .locator('div', { has: page.getByRole('link', { name: 'Empty' }) })
      .locator('button[title="Delete app from collection"]')
      .click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(page.getByRole('link', { name: 'Empty' })).toBeHidden();
  });

  test('should pin an app to an app collection', async ({
    browserName,
    createAppCollection,
    page,
  }) => {
    appCollectionName = `Pin app test ${browserName.slice(0, 8)}`;
    await createAppCollection(
      organizationId,
      appCollectionName,
      'John Doe',
      'Lorem ipsum',
      'mock-data/retail.png',
      'mock-data/tux.png',
      false,
    );

    await page.getByRole('link', { name: 'App store' }).click();
    await page.getByRole('link', { name: 'Empty' }).first().click();
    await page.click('#app-options-menu');
    await page.getByRole('button', { name: 'Add to collection' }).click();
    await page.locator('#collectionId').selectOption({ label: appCollectionName });
    await page
      .locator('.modal-card-foot')
      .getByRole('button', { name: 'Add to collection' })
      .click();

    await page.goBack();
    await page.getByRole('link', { name: 'Person' }).first().click();
    await page.click('#app-options-menu');
    await page.getByRole('button', { name: 'Add to collection' }).click();
    await page.locator('#collectionId').selectOption({ label: appCollectionName });
    await page
      .locator('.modal-card-foot')
      .getByRole('button', { name: 'Add to collection' })
      .click();

    await page.goto('/en/collections');
    await page.getByRole('link', { name: appCollectionName }).click();
    await page.getByRole('button', { name: 'Edit' }).click();
    await page
      .locator('div', {
        has: page.getByRole('link', { name: 'Person' }),
        hasNot: page.getByRole('link', { name: 'Empty' }),
      })
      .locator('button[title="Pin app to top of collection"]')
      .click();
    await page.getByRole('button', { name: 'Stop editing' }).click();

    // TODO make sure this doesn't die in CI either
    await expect(page.getByRole('main')).toHaveScreenshot({
      timeout: 5000,
      maxDiffPixelRatio: 0.02,
    });
  });
});
