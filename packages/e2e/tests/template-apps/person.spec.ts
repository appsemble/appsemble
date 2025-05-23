import { expect, test } from '../../index.js';

test.describe('Person', () => {
  test.beforeEach(async ({ page, visitApp }) => {
    await visitApp('person');
    await page.waitForURL('**/person-registration-form');
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

    await page.click(`td:has-text("${firstName}")`);

    await expect(page.getByText(firstName)).toBeVisible();
    await expect(page.getByText(lastName)).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();
  });
});
