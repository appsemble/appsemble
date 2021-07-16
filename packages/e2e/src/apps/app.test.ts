import { login, open } from '../utils';

describe('/apps/:appId', () => {
  beforeAll(async () => {
    await open('/en/apps');
    await login('/en/apps');
    await page.waitForResponse('/api/apps');
    // Const [button] = await page.$x("//a[contains(., 'Person')]");
    // await button.click();
    // await page.click('[title="A simple form and data viewing app using the resource API"]');
  });

  beforeEach(async () => {
    await open('/en/apps');
  });

  it('should link to the asset viewer', async () => {
    await expect(page).toClick('a', { text: 'Person' });
    await expect(page).toClick('a', { text: 'Assets' });
    await expect(page).toMatch('Upload new asset');
  });

  it('should link to resource', async () => {
    await expect(page).toClick('a', { text: 'Person' });
    await expect(page).toClick('a', { text: 'Resources' });
    await expect(page).toMatch('This app has the following resources');
  });

  it('should link to a specific resource', async () => {
    await expect(page).toClick('a', { text: 'Person' });
    await expect(page).toClick('a', { text: 'Resources' });
    await expect(page).toMatch('Resource person');
  });

  it('should link to the translator tool', async () => {
    await expect(page).toClick('a', { text: 'Person' });
    await expect(page).toClick('a', { text: 'Translations' });
    await expect(page).toMatch('Selected language');
  });

  it('should link to the notification sender', async () => {
    await expect(page).toClick('a', { text: 'Person' });
    await expect(page).toClick('a', { text: 'Notifications' });
    await expect(page).toMatch('Push notifications are currently not enabled in this app. ');
  });

  it('should link to the snapshots page', async () => {
    await expect(page).toClick('a', { text: 'Person' });
    await expect(page).toClick('a', { text: 'Snapshots' });
    await expect(page).toMatch('Snapshots');
    // The list of <ul> on this page should be:
    // 3 menu-lists for the navigation menu, breadcrumbs, list of snapshots
    expect(document.getElementsByTagName('ul')[4].children.length).toBeGreaterThanOrEqual(1);
    // XXX: Perhaps add a specific match for the dates of snapshots to show up here.
  });

  it('should link to the app settings', async () => {
    await expect(page).toClick('a', { text: 'Person' });
    await expect(page).toClick('a', { text: 'Settings' });
    await expect(page).toMatch('App lock');
    await expect(page).toMatch('Dangerous actions');
  });

  it('should link to the app secrets', async () => {
    await expect(page).toClick('a', { text: 'Person' });
    await expect(page).toClick('a', { text: 'Secrets' });
    await expect(page).toMatch('Appsemble Login');
  });
});
