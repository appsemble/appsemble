import { PredefinedOrganizationRole } from '@appsemble/types';
import { type Page } from '@playwright/test';

import { authenticatedTest as test, expect } from '../../../index.js';
import {
  createGroup,
  createRealm,
  createUpstreamOidcClient,
  createUser,
  getAdminToken,
  joinGroup,
  requestKc,
} from '../../../utils/keycloak-admin.js';

const { KEYCLOAK_BASE_URL, KEYCLOAK_REALM = 'appsemble-e2e' } = process.env;
const clientId = 'appsemble-studio';
const clientSecret = 'studio-e2e-secret';
const password = 'studio-e2e-password';

async function signInAtKeycloak(
  page: Page,
  email: string,
  organizationId: string,
): Promise<string> {
  const callback = page.waitForResponse(`**/api/organizations/${organizationId}/sso/callback`);
  await page.getByRole('textbox', { name: /username or email/i }).fill(email);
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  const response = await callback;
  expect(response.status()).toBe(200);
  return ((await response.json()) as { access_token: string }).access_token;
}

test.describe('Studio organization Keycloak OIDC', () => {
  test.skip(!KEYCLOAK_BASE_URL, 'Studio OIDC login requires KEYCLOAK_BASE_URL');

  test('Owners configure SSO and staff return with current group permissions', async ({
    baseURL,
    browser,
    createOrganization,
    page,
    randomTestId,
    request,
  }, testInfo) => {
    test.setTimeout(180_000);

    if (!baseURL) {
      throw new Error('The Studio OIDC test requires a base URL');
    }
    const token = await getAdminToken();
    await createRealm(token, KEYCLOAK_REALM);
    const parent = await createGroup(token, KEYCLOAK_REALM, 'Appsemble');
    const owners = await createGroup(token, KEYCLOAK_REALM, 'Owners', parent);
    const translators = await createGroup(token, KEYCLOAK_REALM, 'Translators', parent);
    const contentManagers = await createGroup(token, KEYCLOAK_REALM, 'ContentManagers', parent);
    await createUpstreamOidcClient(token, KEYCLOAK_REALM, {
      clientId,
      clientSecret,
      redirectUris: [new URL('/callback', baseURL).href],
      requirePkce: true,
    });
    const ownerEmail = `worker-${testInfo.parallelIndex}@appsemble.com`;
    const owner = await createUser(token, KEYCLOAK_REALM, {
      email: ownerEmail,
      firstName: 'Studio',
      lastName: 'Owner',
      password,
    });
    await joinGroup(token, KEYCLOAK_REALM, owner, owners);
    const staffEmail = `staff-${randomTestId()}@appsemble.com`;
    const staff = await createUser(token, KEYCLOAK_REALM, {
      email: staffEmail,
      firstName: 'Studio',
      lastName: 'Staff',
      password,
    });
    await joinGroup(token, KEYCLOAK_REALM, staff, translators);
    await joinGroup(token, KEYCLOAK_REALM, staff, contentManagers);
    const organization = await createOrganization({
      id: randomTestId(),
      name: 'Studio SSO Integration',
    });
    let ownerAccessToken: string | undefined;
    let cleanupFailure: unknown;

    try {
      await page.goto(`/en/organizations/${organization.id}/sso`);
      await page
        .getByRole('textbox', { name: 'Provider name', exact: true })
        .fill('Staff Keycloak');
      await page
        .getByRole('textbox', { name: 'Issuer URL', exact: true })
        .fill(`${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}`);
      await page.getByRole('textbox', { name: 'Client ID', exact: true }).fill(clientId);
      await page.getByLabel('Client secret', { exact: true }).fill(clientSecret);
      for (const [index, group, role] of [
        [1, '/Appsemble/Owners', PredefinedOrganizationRole.Owner],
        [2, '/Appsemble/Translators', PredefinedOrganizationRole.AppTranslator],
        [3, '/Appsemble/ContentManagers', PredefinedOrganizationRole.AppContentsManager],
      ] as const) {
        await page.getByRole('button', { name: 'Add group mapping', exact: true }).click();
        const mapping = page.getByRole('group', { name: `Group mapping ${index}`, exact: true });
        await mapping.getByRole('textbox', { name: 'Group', exact: true }).fill(group);
        await mapping
          .getByRole('combobox', { name: 'Organization role', exact: true })
          .selectOption(role);
      }
      await page.getByRole('button', { name: 'Verify connection and save', exact: true }).click();
      ownerAccessToken = await signInAtKeycloak(page, ownerEmail, organization.id);
      await expect(page).toHaveURL(new RegExp(`/organizations/${organization.id}(?:/|$)`));
      await page.goto(`/en/organizations/${organization.id}/sso`);
      await page
        .getByRole('combobox', { name: 'Organization sign-in policy', exact: true })
        .selectOption('required');
      await page.getByRole('button', { name: 'Save single sign-on settings', exact: true }).click();
      await expect(page.getByText('Single sign-on settings saved.', { exact: true })).toBeVisible();
      expect((await request.get(`/api/organizations/${organization.id}/members`)).status()).toBe(
        403,
      );

      const firstContext = await browser.newContext({
        baseURL,
        ignoreHTTPSErrors: true,
        storageState: { cookies: [], origins: [] },
      });
      const firstStaffPage = await firstContext.newPage();
      const returningContext = await browser.newContext({
        baseURL,
        ignoreHTTPSErrors: true,
        storageState: { cookies: [], origins: [] },
      });
      try {
        await firstStaffPage.goto(`/en/login?organization=${organization.id}`);
        await expect(
          firstStaffPage.getByRole('textbox', { name: 'Password', exact: true }),
        ).toBeHidden();
        await firstStaffPage
          .getByRole('button', { name: 'Login with Staff Keycloak', exact: true })
          .click();
        await signInAtKeycloak(firstStaffPage, staffEmail, organization.id);
        await expect(firstStaffPage).toHaveURL(
          new RegExp(`/organizations/${organization.id}(?:/|$)`),
        );
        await firstStaffPage.goto(`/en/organizations/${organization.id}/members`);
        const firstStaffRow = firstStaffPage.getByRole('row', { name: /Studio Staff/ });
        await expect(firstStaffRow).toContainText('AppTranslator');
        await expect(firstStaffRow).toContainText('AppContentsManager');

        await requestKc(
          `/admin/realms/${KEYCLOAK_REALM}/users/${staff}/groups/${contentManagers}`,
          {
            expectedStatuses: [204],
            method: 'DELETE',
            token: await getAdminToken(),
          },
        );
        const returningPage = await returningContext.newPage();
        await returningPage.goto(`/en/login?organization=${organization.id}`);
        await returningPage
          .getByRole('button', { name: 'Login with Staff Keycloak', exact: true })
          .click();
        await signInAtKeycloak(returningPage, staffEmail, organization.id);
        await expect(returningPage).toHaveURL(
          new RegExp(`/organizations/${organization.id}(?:/|$)`),
        );
        await returningPage.goto(`/en/organizations/${organization.id}/members`);
        const returningStaffRow = returningPage.getByRole('row', { name: /Studio Staff/ });
        await expect(returningStaffRow).toContainText('AppTranslator');
        await expect(returningStaffRow).not.toContainText('AppContentsManager');
        await firstStaffPage.reload();
        await expect(firstStaffRow).not.toContainText('AppContentsManager');
      } finally {
        await Promise.allSettled([firstContext.close(), returningContext.close()]);
      }
    } finally {
      try {
        const cleanup = await request.delete(`/api/organizations/${organization.id}`, {
          ...(ownerAccessToken ? { headers: { authorization: `Bearer ${ownerAccessToken}` } } : {}),
        });
        expect(cleanup.status()).toBe(200);
        await requestKc(`/admin/realms/${KEYCLOAK_REALM}`, {
          expectedStatuses: [204],
          method: 'DELETE',
          token: await getAdminToken(),
        });
      } catch (cleanupError) {
        cleanupFailure = cleanupError;
        await testInfo.attach('cleanup-error', {
          body: String(cleanupError),
          contentType: 'text/plain',
        });
      }
    }
    if (cleanupFailure) {
      throw cleanupFailure;
    }
  });
});
