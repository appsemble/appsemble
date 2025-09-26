import { type AppCollection } from '@appsemble/types';

import { expect, test } from '../../../index.js';

let organizationId: string;
let appCollectionName: string;
let appCollectionId: number | undefined;

test.describe('App Collections', () => {
  test.beforeAll(async ({ createOrganization, randomTestId }) => {
    organizationId = (await createOrganization({ id: randomTestId() })).id;
  });

  test.beforeEach(({ randomTestId }) => {
    appCollectionName = randomTestId(1);
  });

  test.afterEach(async ({ deleteAppCollection }) => {
    if (appCollectionId !== undefined) {
      await deleteAppCollection(appCollectionId);
      appCollectionId = undefined;
    }
  });

  test.afterAll(async ({ deleteOrganization }) => {
    await deleteOrganization(organizationId);
  });

  test('should create an app collection', async ({ page }) => {
    await page.route('/test-assets/side.png', (route) => {
      route.fulfill({ path: 'mock-data/tux.png' });
    });

    page.on('response', async (response) => {
      if (
        response.request().method() === 'POST' &&
        /\/api\/organizations\/\d+\/app-collections$/.test(response.url())
      ) {
        appCollectionId = ((await response.json()) as AppCollection).id;
      }
    });

    await page.goto(`/en/organizations/${organizationId}/collections`);

    await page.getByRole('button', { name: 'Create new app collection' }).click();

    await test.step('Fill in app collection details', async () => {
      await page.getByLabel('Name', { exact: true }).fill(appCollectionName);
      await page.getByLabel('Header image').setInputFiles('mock-data/retail.png');
      await page.getByLabel('Expert name').fill('John Doe');
      await page
        .getByLabel('Expert description')
        .fill('Lorem ipsum\n\n**text in bold**\n\n![side image](/test-assets/side.png)');
      await page.getByLabel('Expert photo').setInputFiles('mock-data/tux.png');
      // Avatar editor
      await page.getByRole('button', { name: 'Save' }).click();
    });

    await page.getByRole('button', { name: 'Create app collection' }).click();

    await page.getByRole('link', { name: `${appCollectionName} John Doe` }).click();

    await expect(page.getByLabel('Breadcrumbs').locator('li:nth-child(2)')).toHaveText(
      appCollectionName,
    );
    await expect(
      page.locator('header.has-background-primary.is-flex.is-flex-wrap-wrap'),
    ).toHaveScreenshot('collection-header.png', {
      maxDiffPixelRatio: 0.02,
      mask: [page.getByText(appCollectionName)],
    });
    await expect(page.getByRole('heading', { name: appCollectionName })).toBeVisible();

    await page.getByRole('link', { name: 'Expert' }).click();

    await page.getByRole('img', { name: 'side image' }).waitFor({ state: 'visible' });

    await expect(page.locator('section:has(div)')).toHaveScreenshot('expert-page.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('should hide a private app collection if user is not in organization', async ({
    browser,
    createAppCollection,
    page,
  }) => {
    appCollectionId = (
      await createAppCollection(
        organizationId,
        appCollectionName,
        'private',
        'John Doe',
        'mock-data/retail.png',
        'mock-data/tux.png',
        'Lorem ipsum',
      )
    ).id;

    await page.goto(`/en/organizations/${organizationId}/collections`);
    await expect(page.getByRole('link', { name: appCollectionName })).toBeVisible();

    const loggedOutPage = await browser.newPage({ storageState: undefined });
    await loggedOutPage.goto(`/en/organizations/${organizationId}/collections`);
    await expect(loggedOutPage.getByRole('link', { name: appCollectionName })).toBeHidden();
  });

  test('should edit an app collection', async ({ createAppCollection, page }) => {
    appCollectionId = (
      await createAppCollection(
        organizationId,
        appCollectionName,
        'public',
        'John Doe',
        'mock-data/retail.png',
        'mock-data/tux.png',
        'Lorem ipsum',
      )
    ).id;

    await page.goto(`/en/organizations/${organizationId}/collections`);
    await page.getByRole('link', { name: appCollectionName }).click();
    await page.getByRole('link', { name: 'Settings' }).click();

    const oldName = appCollectionName;
    appCollectionName = appCollectionName.split('').reverse().join('');
    await page.getByLabel('Name', { exact: true }).fill(appCollectionName);
    await page.getByLabel('Expert name').fill('Jane Doe');
    await page.getByLabel('Expert description').fill('Hello world');
    await page.getByRole('button', { name: 'Save' }).click();

    await page.getByRole('link', { name: ' Apps' }).click();

    await expect(page.getByRole('heading', { name: oldName })).toBeHidden();

    await page.getByRole('link', { name: 'Expert Jane Doe' }).click();
    await expect(page.locator('h1').filter({ hasText: 'Jane Doe' })).toBeVisible();
  });

  test('should delete an app collection', async ({ createAppCollection, page }) => {
    appCollectionId = (
      await createAppCollection(
        organizationId,
        appCollectionName,
        'public',
        'John Doe',
        'mock-data/retail.png',
        'mock-data/tux.png',
        'Lorem ipsum',
      )
    ).id;
    await page.goto(`/en/organizations/${organizationId}/collections`);
    await page.getByRole('link', { name: appCollectionName }).click();
    await page.getByRole('link', { name: 'Settings' }).click();

    await page.getByRole('button', { name: 'Delete app collection' }).click();
    await page.getByRole('button', { name: 'Delete app collection', exact: true }).click();

    await expect(page.getByText('Successfully deleted app')).toBeVisible();
    await expect(page.getByRole('link', { name: appCollectionName })).toBeHidden();

    // Make sure the afterEach hook doesn't try to delete the already deleted collection
    appCollectionId = undefined;
  });

  test('should add an app to an app collection', async ({
    createApp,
    createAppCollection,
    deleteApp,
    page,
    randomTestId,
  }) => {
    appCollectionId = (
      await createAppCollection(
        organizationId,
        appCollectionName,
        'public',
        'John Doe',
        'mock-data/retail.png',
        'mock-data/tux.png',
        'Lorem ipsum',
      )
    ).id;

    const appName = `Test app ${randomTestId()}`;
    const { id } = await createApp(
      organizationId,
      `
      name: ${appName}
      defaultPage: Test Page
      pages:
        - name: Test Page
          blocks:
            - type: data-loader
              version: 0.34.15
      `,
    );

    await page.goto(`/en/apps/${id}`);
    await page.click('#app-options-menu');
    await page.getByRole('button', { name: 'Add to collection' }).click();
    await page.getByRole('combobox').selectOption({ label: appCollectionName });
    await page.locator('form').getByRole('button', { name: 'Add to collection' }).click();

    await page.goto(`/en/collections/${appCollectionId}`);
    await expect(page.getByRole('link', { name: appName })).toBeVisible();

    await deleteApp(id!);
  });

  test('should remove an app from an app collection', async ({
    addAppToAppCollection,
    createApp,
    createAppCollection,
    deleteApp,
    page,
    randomTestId,
  }) => {
    appCollectionId = (
      await createAppCollection(
        organizationId,
        appCollectionName,
        'public',
        'John Doe',
        'mock-data/retail.png',
        'mock-data/tux.png',
        'Lorem ipsum',
      )
    ).id;

    const appName = `Test app ${randomTestId()}`;
    const { id } = await createApp(
      organizationId,
      `
      name: ${appName}
      defaultPage: Test Page
      pages:
        - name: Test Page
          blocks:
            - type: data-loader
              version: 0.34.15
      `,
    );

    await addAppToAppCollection(appCollectionId!, id!);

    await page.goto(`/en/collections/${appCollectionId}`);
    await page.getByRole('button', { name: 'Edit' }).click();
    await page
      .locator('div', { has: page.getByRole('link', { name: appName }) })
      .getByTitle('Delete app from collection')
      .click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(page.getByRole('link', { name: appName })).toBeHidden();

    await deleteApp(id!);
  });

  test('should pin an app to an app collection', async ({
    addAppToAppCollection,
    createApp,
    createAppCollection,
    deleteApp,
    page,
    randomTestId,
  }) => {
    appCollectionId = (
      await createAppCollection(
        organizationId,
        appCollectionName,
        'public',
        'John Doe',
        'mock-data/retail.png',
        'mock-data/tux.png',
        'Lorem ipsum',
      )
    ).id;

    const app1 = await createApp(
      organizationId,
      `
      name: Test app ${randomTestId()}
      defaultPage: Test Page
      pages:
        - name: Test Page
          blocks:
            - type: data-loader
              version: 0.34.15
      `,
    );
    const app2 = await createApp(
      organizationId,
      `
      name: Test app ${randomTestId()}
      defaultPage: Test Page
      pages:
        - name: Test Page
          blocks:
            - type: data-loader
              version: 0.34.15
      `,
    );

    await addAppToAppCollection(appCollectionId!, app1.id!);
    await addAppToAppCollection(appCollectionId!, app2.id!);

    await page.goto(`/en/collections/${appCollectionId}`);
    await page.getByRole('button', { name: 'Edit' }).click();
    await page
      .locator('div', {
        has: page.getByRole('link', { name: app1.definition.name }),
        hasNot: page.getByRole('link', { name: app2.definition.name }),
      })
      .getByTitle('Pin app to top of collection')
      .click();
    await page.getByRole('button', { name: 'Stop editing' }).click();

    await expect(page.getByRole('main')).toHaveScreenshot('collection-apps-with-pinned.png', {
      maxDiffPixelRatio: 0.02,
      mask: [
        page.getByRole('heading', { name: app1.definition.name }),
        page.getByRole('heading', { name: app2.definition.name }),
        page.getByRole('heading', { name: organizationId }),
      ],
    });

    await deleteApp(app1.id!);
    await deleteApp(app2.id!);
  });
});
