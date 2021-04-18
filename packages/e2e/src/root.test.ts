import { createURL, open } from './utils';

describe('/', () => {
  beforeEach(async () => {
    await open('/en/apps');
  });

  it('should allow to switch languages', async () => {
    await expect(page).toMatch('Login');
    await expect(page).toClick('button', { text: 'EN' });
    await expect(page).toClick('a', { text: 'Dutch' });
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.waitForResponse(createURL('/api/messages/nl'));
    await expect(page).toMatch('Inloggen');
    expect(page.url()).toBe(createURL('/nl/apps'));
  });
});
