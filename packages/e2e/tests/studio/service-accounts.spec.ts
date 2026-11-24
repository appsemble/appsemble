import { type APIRequestContext } from '@playwright/test';

import { expect, authenticatedTest as test } from '../../index.js';

let organizationId: string;

function requestToken(
  api: APIRequestContext,
  credentials: string,
): ReturnType<APIRequestContext['post']> {
  return api.post('/auth/oauth2/token', {
    form: { grant_type: 'client_credentials', scope: 'organizations:write' },
    headers: { authorization: `Basic ${Buffer.from(credentials).toString('base64')}` },
  });
}

test.describe('Organization service accounts', () => {
  test.beforeAll(async ({ createOrganization, randomTestId }) => {
    organizationId = randomTestId();
    await createOrganization({ id: organizationId, name: 'Example organization' });
  });

  test.afterAll(async ({ deleteOrganization }) => {
    await deleteOrganization(organizationId);
  });

  test('should authenticate client credentials until the service account is revoked', async ({
    baseURL,
    page,
    playwright,
  }) => {
    await page.goto(`/en/organizations/${organizationId}/members`);
    await page.getByRole('button', { name: 'Create service account' }).click();
    const form = page.getByRole('dialog', { name: 'Create service account' });
    await form.getByRole('textbox', { name: 'Description' }).fill('Deployments');
    await form.getByLabel('Role').selectOption('AppManager');
    await form.getByText('Create and manage organizations').click();
    await form.getByRole('button', { name: 'Create' }).click();
    const credentials = await form
      .getByRole('textbox', { name: 'Client credentials' })
      .inputValue();
    await form.getByText('Close', { exact: true }).click();
    await expect(form).toBeHidden();
    const serviceAccount = page.getByRole('row', { name: /Deployments/ });
    await expect(serviceAccount).toBeVisible();
    await page.getByRole('button', { name: 'Create service account' }).click();
    await expect(form.getByRole('textbox', { name: 'Client credentials' })).toBeHidden();
    await form.getByRole('button', { name: 'Cancel' }).click();
    await expect(form).toBeHidden();

    const api = await playwright.request.newContext({ baseURL, ignoreHTTPSErrors: true });
    const token = await requestToken(api, credentials);
    expect(token.status()).toBe(200);
    const { access_token: accessToken } = (await token.json()) as { access_token: string };
    const getMembers = (): ReturnType<APIRequestContext['get']> =>
      api.get(`/api/organizations/${organizationId}/members`, {
        headers: { authorization: `Bearer ${accessToken}` },
      });
    expect((await getMembers()).status()).toBe(200);

    await serviceAccount.getByRole('button', { name: 'Revoke' }).click();
    await page
      .getByRole('dialog', { name: 'Revoke service account' })
      .getByRole('button', { name: 'Revoke' })
      .click();
    await expect(serviceAccount).toBeHidden();

    expect({
      members: (await getMembers()).status(),
      token: await (await requestToken(api, credentials)).json(),
    }).toStrictEqual({ members: 401, token: { error: 'invalid_client' } });
    await api.dispose();
  });
});
