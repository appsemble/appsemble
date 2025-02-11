import { type Page } from '@playwright/test';

import { expect, test } from '../fixtures/test/index.js';

const organization = 'appsemble';

async function createCollection({
  collectionName,
  expertDescription,
  expertName,
  expertPhoto,
  headerImage,
  isPrivate,
  page,
}: {
  page: Page;
  collectionName: string;
  expertName: string;
  expertDescription: string;
  headerImage: string;
  expertPhoto: string;
  isPrivate: boolean;
}): Promise<void> {
  await page.getByRole('link', { name: 'App collections' }).first().click();
  await page.getByRole('button', { name: 'Create new app collection' }).click();

  await page.getByLabel('Name', { exact: true }).fill(collectionName);
  await page.locator('span').filter({ hasText: 'Header image' }).first().setInputFiles(headerImage);

  if (isPrivate) {
    await page.getByText('Hide this app collection from the public list').click();
  }

  await page.getByLabel('Expert name').fill(expertName);
  await page.getByLabel('Expert description').fill(expertDescription);

  await page.locator('span').filter({ hasText: 'Expert photo' }).first().setInputFiles(expertPhoto);

  // Avatar editor
  await page.getByRole('button', { name: 'Save' }).click();

  await page.getByRole('button', { name: 'Create app collection' }).click();

  await page.getByRole('heading', { name: collectionName }).waitFor({ state: 'visible' });
}

test.describe('App Collections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/en/organizations/${organization}`);
  });

  test('should create an app collection', async ({ browserName, page }) => {
    const collectionName = `Create test ${browserName.slice(0, 8)}`;
    await page.route('/test-assets/side.png', (route) => {
      route.fulfill({ path: 'fixtures/data/tux.png' });
    });
    await createCollection({
      page,
      collectionName,
      expertName: 'John Doe',
      expertDescription: 'Lorem ipsum\n\n**text in bold**\n\n![side image](/test-assets/side.png)',
      expertPhoto: 'fixtures/data/tux.png',
      headerImage: 'fixtures/data/retail.png',
      isPrivate: false,
    });

    await page.getByRole('link', { name: collectionName }).click();

    await expect(page.getByLabel('Breadcrumbs').locator('li:nth-child(2)')).toHaveText(
      collectionName,
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

  test('should create a private app collection', async ({ browserName, logoutStudio, page }) => {
    const collectionName = `Private test ${browserName.slice(0, 8)}`;
    await createCollection({
      page,
      collectionName,
      expertName: 'John Doe',
      expertDescription: 'Lorem ipsum',
      expertPhoto: 'fixtures/data/tux.png',
      headerImage: 'fixtures/data/retail.png',
      isPrivate: true,
    });

    await page.goto('/en/collections');
    await page.getByRole('heading', { name: 'App collections' }).waitFor({ state: 'visible' });
    await expect(page.getByRole('link', { name: collectionName })).toBeVisible({
      timeout: 5000,
    });

    await logoutStudio();
    await page.goto('/en/collections');
    await page.getByRole('heading', { name: 'App collections' }).waitFor({ state: 'visible' });
    await expect(page.getByRole('link', { name: collectionName })).toBeHidden({
      timeout: 5000,
    });
  });

  test('should edit an app collection', async ({ browserName, page }) => {
    const collectionName = `Edit test ${browserName.slice(0, 8)}`;
    await createCollection({
      page,
      collectionName,
      expertName: 'John Doe',
      expertDescription: 'Lorem ipsum',
      expertPhoto: 'fixtures/data/tux.png',
      headerImage: 'fixtures/data/retail.png',
      isPrivate: false,
    });

    await page.getByRole('link', { name: collectionName }).click();
    await page.getByRole('link', { name: 'Settings' }).click();

    const newName = collectionName.split('').reverse().join('');
    await page.getByLabel('Name', { exact: true }).fill(newName);
    await page.getByLabel('Expert name').fill('Jane Doe');
    await page.getByLabel('Expert description').fill('Hello world');
    await page.getByRole('button', { name: 'Save' }).click();

    await page.getByRole('link', { name: /Apps$/ }).click();

    await expect(page.getByRole('heading', { name: collectionName })).toBeHidden();
    await expect(page.getByRole('heading', { name: newName })).toBeVisible();

    await page.getByRole('link', { name: 'Expert Jane Doe' }).click();
    await expect(page.locator('h1').filter({ hasText: 'Jane Doe' })).toBeVisible();
  });

  test('should delete an app collection', async ({ browserName, page }) => {
    const collectionName = `Delete test ${browserName.slice(0, 8)}`;
    await createCollection({
      page,
      collectionName,
      expertName: 'John Doe',
      expertDescription: 'Lorem ipsum',
      expertPhoto: 'fixtures/data/tux.png',
      headerImage: 'fixtures/data/retail.png',
      isPrivate: false,
    });
    await page.getByRole('link', { name: `${collectionName} John Doe` }).click();
    await page.getByRole('link', { name: 'Settings' }).click();

    await page.getByRole('button', { name: 'Delete app collection' }).click();
    await page.getByRole('button', { name: 'Delete app collection', exact: true }).click();

    await page.getByRole('heading', { name: 'App collections' }).waitFor({ state: 'visible' });
    await expect(page.getByRole('link', { name: collectionName })).toBeHidden({
      timeout: 5000,
    });
  });

  test('should add an app to an app collection', async ({ browserName, page }) => {
    const collectionName = `Add app test ${browserName.slice(0, 8)}`;
    await createCollection({
      page,
      collectionName,
      expertName: 'John Doe',
      expertDescription: 'Lorem ipsum',
      expertPhoto: 'fixtures/data/tux.png',
      headerImage: 'fixtures/data/retail.png',
      isPrivate: false,
    });

    await page.getByRole('link', { name: 'App store' }).click();
    await page.getByRole('link', { name: 'Empty' }).first().click();
    await page.click('#app-options-menu');
    await page.getByRole('button', { name: 'Add to collection' }).click();
    await page.locator('#collectionId').selectOption({ label: collectionName });
    await page
      .locator('.modal-card-foot')
      .getByRole('button', { name: 'Add to collection' })
      .click();

    await page.goto('/en/collections');
    await page.getByRole('link', { name: collectionName }).click();

    await expect(page.getByRole('link', { name: 'Empty' })).toBeVisible();
  });

  test('should remove an app from an app collection', async ({ browserName, page }) => {
    const collectionName = `Rm app test ${browserName.slice(0, 8)}`;
    await createCollection({
      page,
      collectionName,
      expertName: 'John Doe',
      expertDescription: 'Lorem ipsum',
      expertPhoto: 'fixtures/data/tux.png',
      headerImage: 'fixtures/data/retail.png',
      isPrivate: false,
    });

    await page.getByRole('link', { name: 'App store' }).click();
    await page.getByRole('link', { name: 'Empty' }).first().click();
    await page.click('#app-options-menu');
    await page.getByRole('button', { name: 'Add to collection' }).click();
    await page.locator('#collectionId').selectOption({ label: collectionName });
    await page
      .locator('.modal-card-foot')
      .getByRole('button', { name: 'Add to collection' })
      .click();

    await page.goto('/en/collections');
    await page.getByRole('link', { name: collectionName }).click();
    await page.getByRole('button', { name: 'Edit' }).click();
    await page
      .locator('div', { has: page.getByRole('link', { name: 'Empty' }) })
      .locator('button[title="Delete app from collection"]')
      .click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(page.getByRole('link', { name: 'Empty' })).toBeHidden();
  });

  test('should pin an app to an app collection', async ({ browserName, page }) => {
    const collectionName = `Pin app test ${browserName.slice(0, 8)}`;
    await createCollection({
      page,
      collectionName,
      expertName: 'John Doe',
      expertDescription: 'Lorem ipsum',
      expertPhoto: 'fixtures/data/tux.png',
      headerImage: 'fixtures/data/retail.png',
      isPrivate: false,
    });

    await page.getByRole('link', { name: 'App store' }).click();
    await page.getByRole('link', { name: 'Empty' }).first().click();
    await page.click('#app-options-menu');
    await page.getByRole('button', { name: 'Add to collection' }).click();
    await page.locator('#collectionId').selectOption({ label: collectionName });
    await page
      .locator('.modal-card-foot')
      .getByRole('button', { name: 'Add to collection' })
      .click();

    await page.goBack();
    await page.getByRole('link', { name: 'Person' }).first().click();
    await page.click('#app-options-menu');
    await page.getByRole('button', { name: 'Add to collection' }).click();
    await page.locator('#collectionId').selectOption({ label: collectionName });
    await page
      .locator('.modal-card-foot')
      .getByRole('button', { name: 'Add to collection' })
      .click();

    await page.goto('/en/collections');
    await page.getByRole('link', { name: collectionName }).click();
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
