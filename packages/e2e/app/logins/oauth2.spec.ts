import { type App, type AppOAuth2Secret } from '@appsemble/types';
import axios from 'axios';

import { expect, test } from '../../fixtures/test/index.js';

let app: App;
let secret: AppOAuth2Secret;

test.describe('App OAuth2 login', () => {
  test.beforeAll(async ({ createTestApp }) => {
    app = await createTestApp(
      'appsemble',
      `
        name: Test App
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
              - type: test
                version: 0.0.0
      `,
    );
    const response = await axios.post<AppOAuth2Secret>(`/api/apps/${app.id}/secrets/oauth2`, {
      name: 'OAuth2',
      icon: 'test',
      authorizationUrl: 'https://example.com/oauth2/authorize',
      tokenUrl: 'https://example.com/oauth/token',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      userInfoUrl: 'https://example.com/oauth/userinfo',
      scope: 'email openid profile',
    });
    secret = response.data;
  });

  test.fixme('should work', async ({ page }) => {
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('button', { name: `Login with ${secret.name}` }).click();

    const redirectUri =
      'http://localhost:9999/callback&response_type=code&scope=email openid profile';

    await page.waitForRequest(
      `/connect/authorize/oauth2/${app.id}?client_id=app:${app.id}&redirect_uri=*&state=*`,
    );

    await page.route(
      `${secret.authorizationUrl}?client_id=${secret.clientId}&redirect_uri=${redirectUri}&state=*`,
      (route) => {
        route.fulfill({
          status: 302,
          headers: {
            location: 'http://localhost:9999/callback?code=*&state=*',
          },
        });
      },
      { times: 1 },
    );

    await page.waitForRequest('http://test.appsemble.localhost:9999/Callback?code=*&state=*');

    await expect(page.getByRole('heading', { name: 'Example Page A' })).toBeVisible();
  });

  test.fixme('should handle app member email conflict', async ({ page }) => {
    await page.click('a.button');
    await expect(page.getByRole('heading', { name: 'Example Page A' })).toBeVisible();
  });
});
