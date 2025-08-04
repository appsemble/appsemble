import { expect, test } from '../../../fixtures/index.js';

const organization = 'Appsemble';
const email = 'test+test_mode@test.com';
const streetName = 'street one';
const houseNumber = '12a';
const city = 'Eindhoven';
const zipCode = '1234DF';
const country = 'NL';

test.describe('Payments', () => {
  const { CI } = process.env;

  test('should cancel a subscription', async ({ page }) => {
    await page.goto(`/en/organizations/${organization.toLowerCase()}/subscriptions`);
    await page
      .locator('.card:has-text("STANDARD")')
      .getByRole('button', { name: 'Cancel' })
      .click();
    await page.getByLabel('Cancellation reason(Optional)').fill('Not happy.');
    await expect(page.getByRole('button', { name: 'Cancel subscription' })).toBeVisible();

    // eslint-disable-next-line playwright/no-conditional-in-test
    if (!CI) {
      await page.getByRole('button', { name: 'Cancel subscription' }).click();
      await expect(page.getByText('Extend')).toBeVisible();
      await expect(page.getByText('Expires on')).toBeVisible();
    }
  });

  (CI ? test.skip : test)('should confirm correct redirect by extension', async ({ page }) => {
    await page.goto(`/en/organizations/${organization.toLowerCase()}/subscriptions`);
    await page.locator('.card:has-text("STANDARD")').getByRole('link', { name: 'Extend' }).click();
    await expect(page).toHaveTitle('Activate · Appsemble', { timeout: 10_000 });
  });

  test('should purchase a subscription', async ({ page }) => {
    await page.goto(`/en/organizations/${organization.toLowerCase()}/subscriptions`);
    await page.locator('.card:has-text("EXTENSIVE")').getByRole('link', { name: 'Switch' }).click();

    await expect(page.getByText('Select type of')).toBeVisible();
    await expect(
      page.getByText('Total subscription priceCoupon discountTotal price'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Checkout ' }).click();

    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Street name').fill(streetName);
    await page.getByLabel('House number').fill(houseNumber);
    await page.getByLabel('City').fill(city);
    await page.getByLabel('Zip code').fill(zipCode);
    await page.getByLabel('Country').selectOption(country);
    await page.getByLabel('Name', { exact: true }).fill(organization);
    await page.getByRole('button').getByText('Continue').click();

    await expect(
      page.getByText(
        'Total subscription priceActive subscription discountCoupon discountVAT 21%Total price',
      ),
    ).toBeVisible();

    // eslint-disable-next-line playwright/no-conditional-in-test
    if (!CI) {
      await page.getByRole('button', { name: 'Summary ' }).click();

      await expect(page).toHaveTitle('Appsemble b.v.', { timeout: 10_000 });
      await page.getByTestId('sepa_debit-accordion-item').click();
      await page.locator('[placeholder="\\NL00 AAAA 0000 0000 00"]').click();
      await page.locator('[placeholder="\\NL00 AAAA 0000 0000 00"]').fill('NL39RABO0300065264');
      await page.getByLabel('Name on account').fill(organization);
      await page.getByPlaceholder('Address line 1').fill(streetName);
      await page.getByPlaceholder('Postal code').fill(zipCode);
      await page.getByPlaceholder('City').fill(city);
      await page.getByTestId('hosted-payment-submit-button').click();
      await expect(page.getByText('Purchase successful')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText('New expiration date')).toBeVisible({ timeout: 60_000 });
      await expect(page.getByText('Subscription plan')).toBeVisible();
      await expect(page.getByText('Renewal period')).toBeVisible();
      await expect(page.getByText('extensive')).toBeVisible();
      await expect(page.getByText('month')).toBeVisible();
      await page.getByRole('link', { name: 'Finish' }).click();
    }
  });
});
