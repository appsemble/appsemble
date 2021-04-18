import { createURL, login, open } from './utils';

describe('/apps', () => {
  beforeEach(async () => {
    await open('/en/apps');
  });

  it('should show the page header', async () => {
    await expect(page).toMatch('All Apps');
    await expect(page).not.toMatch('My Apps');
  });

  it('should display “My Apps” when logged in', async () => {
    await login();
    expect(page.url()).toBe(createURL('/en/apps'));
    await page.waitForResponse(createURL('/api/apps'));
    await expect(page).toMatch('My Apps');
    await expect(page).toMatch('All Apps');
  });

  it('should render a list of apps', async () => {
    await expect(page).toMatch('Empty');
    await expect(page).toMatch('Holidays');
    await expect(page).toMatch('Notes');
    await expect(page).toMatch('Person');
    await expect(page).toMatch('Unlittered');
  });

  it('should link to app details', async () => {
    await expect(page).toClick('a', { text: 'Empty' });
    await expect(page).toMatch(
      'Empty App is a bare-bones app with two pages and buttons switching between them.',
    );
    await expect(page).toMatch(
      'This is a very minimalist app. It serves as a starting point for you to start building your own app. It contains two pages, each with a single action button that links to the other page.',
    );
  });
});
