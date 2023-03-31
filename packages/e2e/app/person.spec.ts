import { test } from '../fixtures/test/index.js';

test.describe('Person', () => {
  test.beforeEach(async ({ visitApp }) => {
    await visitApp('person');
  });

  test('should submit a new person and view it', async ({ page }) => {
    const date = Date.now();

    const firstName = `First name ${date}`;
    const lastName = `Last name ${date}`;
    const email = `Email${date}@example.com`;
    const description = `Description ${date}`;

    await page.fill('[placeholder="First name"]', firstName);
    await page.fill('[placeholder="Last name"]', lastName);
    await page.fill('[placeholder="Email"]', email);
    await page.fill('[placeholder="Description"]', description);

    await page.click('button[type="submit"]');

    await page.waitForSelector(`td:has-text("${firstName}")`);
    await page.waitForSelector(`td:has-text("${lastName}")`);
    await page.click(`td:has-text("${firstName}")`);

    await page.waitForSelector(`:has-text("${firstName}")`);
    await page.waitForSelector(`:has-text("${lastName}")`);
    await page.waitForSelector(`:has-text("${email}")`);
    await page.waitForSelector(`:has-text("${description}")`);
  });
});
