import { expect, baseTest as test } from '../../index.js';

test.describe('Blocks', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/blocks', async (route) => {
      await route.fulfill({ path: 'mock-data/block-list.json' });
    });

    await page.route('**/api/blocks/@test-org/test-block/versions/0.0.0', async (route) => {
      await route.fulfill({ path: 'mock-data/test-block-details.json' });
    });

    await page.route('**/api/blocks/@test-org/test-block/versions/list', async (route) => {
      await route.fulfill({ json: ['0.0.0'] });
    });

    await page.goto('/en/blocks');
  });

  test('should render a list of blocks', async ({ page }) => {
    await expect(page.getByTitle('@test-org/test-block')).toMatchAriaSnapshot(`
    - banner:
      - figure: 
      - heading "test-block" [level=5]
      - heading "@test-org" [level=6]:
        - link "@test-org"
      - text: 0.0.0
    - text: A test block
    - contentinfo:
      - link "View details"
    `);
  });

  test('should link to block details', async ({ page }) => {
    await page.getByTitle('@test-org/test-block').getByText('View details').click();

    await expect(page.getByRole('heading', { name: 'Parameters', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Actions', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Events', exact: true })).toBeVisible();
  });
});
