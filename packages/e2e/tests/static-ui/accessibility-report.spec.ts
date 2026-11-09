import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { expect, baseTest as test } from '../../index.js';

const origin = 'https://report.test';

const pages: Record<string, string> = {
  '/': '<h1>Home</h1><a href="/about">About</a><a href="/home">Home</a>',
  '/about': `<h1>About</h1><img id="logo" src="/apps/42/icon"><a href="/apps/42"></a><a href="/apps/43"></a>
    <div data-block="@appsemble/image" data-path="pages.1.blocks.0">
      <div id="host"><template shadowrootmode="open"><img id="photo"></template></div>
    </div>`,
  '/home': "<script>history.replaceState(null, '', '/')</script>",
};

test.describe('Accessibility report', () => {
  test.beforeEach(async ({ browserName, page }) => {
    test.skip(browserName !== 'chromium', 'The axe-core results do not depend on the browser');

    await page.route(`${origin}/**`, (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html><html lang="en"><title>Page</title><main>${
          pages[new URL(route.request().url()).pathname] ?? ''
        }</main></html>`,
      }),
    );
  });

  test('scans each page once', async ({ page, scanAppAccessibility }) => {
    await page.goto(origin);
    const report = await scanAppAccessibility({ name: 'static_redirect' });

    expect(report.pages.map(({ url }) => url).toSorted()).toStrictEqual([
      `${origin}/`,
      `${origin}/about`,
      `${origin}/apps/42`,
    ]);
  });

  test('lists the failing elements of each crawled page', async ({
    page,
    scanAppAccessibility,
  }, testInfo) => {
    await page.goto(origin);
    await scanAppAccessibility({ name: 'static_report' });

    const { path } = testInfo.attachments.find(({ name }) => name === 'accessibility.html')!;
    await page.goto(String(pathToFileURL(path!)));

    const about = page.getByRole('region', { name: `${origin}/about` });
    await about.getByText('Images must have alternative text').click();
    const logo = about.getByRole('listitem').filter({ hasText: '#logo' });
    await expect(logo.getByText('app shell (packages/app)')).toBeVisible();
    await expect(logo.getByText('<img id="logo"')).toBeVisible();
    await expect(
      about
        .getByRole('listitem')
        .filter({ hasText: '#host >>> #photo' })
        .getByText('@appsemble/image (blocks/image) at pages.1.blocks.0'),
    ).toBeVisible();
    await expect(about.getByRole('link', { name: 'How to fix image-alt' })).toBeVisible();
    await expect(
      page
        .getByRole('region', { name: `${origin}/`, exact: true })
        .getByText('No WCAG violations found.'),
    ).toBeVisible();
  });

  test('reports the failing elements of each crawled page to GitLab', async ({
    page,
    scanAppAccessibility,
  }, testInfo) => {
    await page.goto(origin);
    await scanAppAccessibility({ name: 'static_gitlab' });

    const { results } = JSON.parse(
      await readFile(
        join(testInfo.project.outputDir, 'gl-accessibility-static_gitlab.json'),
        'utf8',
      ),
    );

    expect(results[`${origin}/`]).toStrictEqual([]);
    expect(results[`${origin}/about`]).toStrictEqual([
      expect.objectContaining({
        code: 'image-alt',
        type: 'error',
        selector: '#logo',
        message: 'Images must have alternative text: app shell (packages/app)',
        context: '<img id="logo" src="/apps/:id/icon">',
      }),
      expect.objectContaining({
        code: 'image-alt',
        selector: '#host >>> #photo',
        message:
          'Images must have alternative text: @appsemble/image (blocks/image) at pages.1.blocks.0',
      }),
      ...Array.from({ length: 2 }, () =>
        expect.objectContaining({
          code: 'link-name',
          selector: 'a[href="/apps/:id"]',
          context: '<a href="/apps/:id"></a>',
        }),
      ),
    ]);
  });
});
