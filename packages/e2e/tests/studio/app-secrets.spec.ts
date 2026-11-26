import { type App, type AppOAuth2Secret } from '@appsemble/types';

import { expect, authenticatedTest as test } from '../../index.js';
import pkg from '../../package.json' with { type: 'json' };

let app: App;

test.describe('App secrets', () => {
  test.beforeAll(async ({ createApp, request }) => {
    app = await createApp(
      'appsemble',
      `
        name: Secrets App
        defaultPage: Test Page
        security:
          default:
            role: test
            policy: everyone
          roles:
            test:
              description: test
        pages:
          - name: Test Page
            blocks:
              - type: html
                version: ${pkg.version}
                parameters:
                  content: <h1>Test</h1>
      `,
    );
    await request.post(`/api/apps/${app.id}/secrets/oauth2`, {
      data: {
        name: 'Example SSO',
        icon: 'key',
        authorizationUrl: 'https://example.com/oauth2/authorize',
        tokenUrl: 'https://example.com/oauth/token',
        clientId: 'example_client_id',
        clientSecret: 'example_client_secret',
        scope: 'email openid profile',
      },
    });
  });

  test('should keep an OAuth2 client secret that is left empty', async ({ page, request }) => {
    await page.goto(`/en/apps/${app.id}/${app.path}/secrets`);
    await page.getByRole('button', { name: /Example SSO/ }).click();

    await expect(page.getByLabel(/Client secret/)).toHaveValue('');
    await expect(
      page.getByText(
        'A client secret is set. Leave empty to keep it, or enter a new one to replace it.',
      ),
    ).toBeVisible();

    await page.getByLabel('Name', { exact: true }).fill('Renamed SSO');
    await page.getByRole('button', { name: 'Save secret' }).click();
    await expect(page.getByRole('button', { name: /Renamed SSO/ })).toBeVisible();

    const secrets = (await (
      await request.get(`/api/apps/${app.id}/secrets/oauth2`)
    ).json()) as AppOAuth2Secret[];
    expect(secrets).toStrictEqual([
      expect.objectContaining({ incomplete: false, name: 'Renamed SSO' }),
    ]);
    expect(secrets[0]).not.toHaveProperty('clientSecret');
  });
});
