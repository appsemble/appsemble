import { open } from './utils';

describe('/organizations', () => {
  beforeEach(async () => {
    await open('/en/organizations');
  });

  it('should render a list of organitions', async () => {
    // The page always includes the text `Appsemble`. However, since `toMatch()` uses `textContent`
    // we can match `Appsembleappsemble`.
    await expect(page).toMatch('Appsembleappsemble');
  });

  it('should link to organization details', async () => {
    await Promise.all([
      expect(page).toClick('[href="/en/organizations/appsemble"]', { text: 'Appsemble' }),
      await page.waitForFunction(
        () => document.getElementsByClassName('.appsemble-loader').length === 0,
      ),
    ]);
    await expect(page).toMatch('Apps');
    await expect(page).toMatch('Blocks');
    await expect(page).toMatch('Holidays');
    await expect(page).toMatch('action-button');
  });
});
