import {
  createUser as createStudioUser,
  deleteUser as deleteStudioUser,
} from '@appsemble/node-utils';
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

async function signInWithPassword(page: Page, email: string): Promise<string> {
  await page.goto('/en/login?personal=1');
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  const response = page.waitForResponse('**/api/auth/email/login');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  const login = await response;
  expect(login.status()).toBe(200);
  await expect(page.getByText('My apps', { exact: true })).toBeVisible();
  return ((await login.json()) as { access_token: string }).access_token;
}

async function submitKeycloakPassword(page: Page, organizationId: string): Promise<string> {
  const callback = page.waitForResponse(`**/api/organizations/${organizationId}/sso/callback`);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  const response = await callback;
  expect(response.status()).toBe(200);
  return ((await response.json()) as { access_token: string }).access_token;
}

async function signInAtKeycloak(
  page: Page,
  email: string,
  organizationId: string,
): Promise<string> {
  await page.getByRole('textbox', { name: /username or email/i }).fill(email);
  return submitKeycloakPassword(page, organizationId);
}

test.describe('Studio organization Keycloak OIDC', () => {
  test.skip(!KEYCLOAK_BASE_URL, 'Studio OIDC login requires KEYCLOAK_BASE_URL');

  test('Owners configure SSO and staff manage their group access and linked identity', async ({
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
      postLogoutRedirectUris: [new URL('/', baseURL).href],
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
    const unlinkEmail = `unlink-${randomTestId()}@appsemble.com`;
    const unlinkUser = await createUser(token, KEYCLOAK_REALM, {
      email: unlinkEmail,
      firstName: 'Studio',
      lastName: 'Unlink',
      password,
    });
    await joinGroup(token, KEYCLOAK_REALM, unlinkUser, translators);
    const organization = await createOrganization({
      id: randomTestId(),
      name: 'Studio SSO Integration',
    });
    let ownerAccessToken: string | undefined;
    let cleanupFailure: unknown;

    try {
      await createStudioUser('Studio Unlink', unlinkEmail, password);
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
      const personalContext = await browser.newContext({
        baseURL,
        ignoreHTTPSErrors: true,
        storageState: { cookies: [], origins: [] },
      });
      try {
        await firstStaffPage.goto(`/en/login?organization=${organization.id}`);
        await expect(firstStaffPage.getByLabel('Password', { exact: true })).toBeHidden();
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
        const realm = await requestKc(`/admin/realms/${KEYCLOAK_REALM}`, {
          expectedStatuses: [200],
          method: 'GET',
          token: await getAdminToken(),
        });
        const { accessTokenLifespan } = (await realm.json()) as { accessTokenLifespan: number };
        // Provider grants from here on need renewing within seconds, so the CLI token request below
        // depends on a grant that is still valid at Keycloak.
        await requestKc(`/admin/realms/${KEYCLOAK_REALM}`, {
          body: JSON.stringify({ accessTokenLifespan: 10 }),
          expectedStatuses: [204],
          method: 'PUT',
          token: await getAdminToken(),
        });
        try {
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

          await returningPage.goto('/en/settings/client-credentials');
          await returningPage.getByRole('button', { name: 'Register', exact: true }).click();
          await returningPage.getByRole('textbox', { name: /^Description/ }).fill('Staff CLI');
          await returningPage.getByText('Create and manage organizations', { exact: true }).click();
          await returningPage.getByRole('button', { name: 'Create', exact: true }).click();
          const cliCredentials = await returningPage
            .getByRole('textbox', { name: /^Client credentials/ })
            .inputValue();
          const authorized = Date.now();
          await returningPage.goto(
            `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout?client_id=${clientId}`,
          );
          await returningPage.getByRole('button', { name: 'Logout', exact: true }).click();
          await expect(
            returningPage.getByRole('heading', { name: 'You are logged out' }),
          ).toBeVisible();
          await new Promise((resolve) => {
            setTimeout(resolve, authorized + 11_000 - Date.now());
          });
          const cliToken = await request.post('/auth/oauth2/token', {
            form: { grant_type: 'client_credentials', scope: 'organizations:write' },
            headers: { authorization: `Basic ${Buffer.from(cliCredentials).toString('base64')}` },
          });
          expect(cliToken.status()).toBe(200);
        } finally {
          await requestKc(`/admin/realms/${KEYCLOAK_REALM}`, {
            body: JSON.stringify({ accessTokenLifespan }),
            expectedStatuses: [204],
            method: 'PUT',
            token: await getAdminToken(),
          });
        }
        await firstStaffPage.reload();
        await expect(firstStaffRow).not.toContainText('AppContentsManager');

        await firstStaffPage
          .getByRole('button')
          .filter({
            has: firstStaffPage.getByRole('img', { name: 'Profile picture', exact: true }),
          })
          .click();
        await firstStaffPage.getByRole('button', { name: 'Logout', exact: true }).click();
        await firstStaffPage.waitForURL(new URL('/', baseURL).href);
        await firstStaffPage.goto(`/en/login?organization=${organization.id}`);
        await firstStaffPage
          .getByRole('button', { name: 'Login with Staff Keycloak', exact: true })
          .click();
        await expect(
          firstStaffPage.getByRole('textbox', { name: /username or email/i }),
        ).toBeVisible();

        const personalPage = await personalContext.newPage();
        const personalToken = await signInWithPassword(personalPage, unlinkEmail);
        const before = await request.get('/api/users/current', {
          headers: { authorization: `Bearer ${personalToken}` },
        });
        expect(before.status()).toBe(200);
        const account = (await before.json()) as { sub: string };
        await personalPage.goto(`/en/login?organization=${organization.id}`);
        await personalPage
          .getByRole('button', { name: 'Link organization single sign-on', exact: true })
          .click();
        const linkedToken = await signInAtKeycloak(personalPage, unlinkEmail, organization.id);
        await expect(personalPage).toHaveURL(
          new RegExp(`/organizations/${organization.id}(?:/|$)`),
        );
        const linkedIdentity = await request.get('/api/users/current/auth/oidc/identities', {
          headers: { authorization: `Bearer ${linkedToken}` },
        });
        expect(await linkedIdentity.json()).toEqual([
          expect.objectContaining({
            issuer: `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}`,
            subject: unlinkUser,
          }),
        ]);
        await personalPage.goto('/en/settings/user');
        await personalPage.getByRole('link', { name: 'Social login', exact: true }).click();
        await expect(
          personalPage.getByRole('heading', { name: 'Organization single sign-on', exact: true }),
        ).toBeVisible();
        const unlinkButton = personalPage.getByRole('button', {
          name: 'Unlink single sign-on',
          exact: true,
        });
        await expect(unlinkButton).toBeVisible();
        await unlinkButton.click();
        await personalPage
          .getByRole('dialog')
          .getByRole('button', { name: 'Unlink single sign-on', exact: true })
          .click();
        await expect(personalPage).toHaveURL(/\/login(?:\?|$)/);
        expect(
          (
            await request.get('/api/users/current', {
              headers: { authorization: `Bearer ${linkedToken}` },
            })
          ).status(),
        ).toBe(401);

        const recoveredToken = await signInWithPassword(personalPage, unlinkEmail);
        const remaining = await request.get('/api/users/current/auth/oidc/identities', {
          headers: { authorization: `Bearer ${recoveredToken}` },
        });
        expect(await remaining.json()).toStrictEqual([]);
        expect(
          (
            await request.get(`/api/organizations/${organization.id}/members`, {
              headers: { authorization: `Bearer ${recoveredToken}` },
            })
          ).status(),
        ).toBe(403);
        await personalPage.goto(`/en/login?organization=${organization.id}`);
        await personalPage
          .getByRole('button', { name: 'Link organization single sign-on', exact: true })
          .click();
        const relinkedToken = await submitKeycloakPassword(personalPage, organization.id);
        const after = await request.get('/api/users/current', {
          headers: { authorization: `Bearer ${relinkedToken}` },
        });
        expect((await after.json()).sub).toBe(account.sub);
        const relinkedIdentity = await request.get('/api/users/current/auth/oidc/identities', {
          headers: { authorization: `Bearer ${relinkedToken}` },
        });
        expect(await relinkedIdentity.json()).toEqual([
          expect.objectContaining({
            issuer: `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}`,
            subject: unlinkUser,
          }),
        ]);
      } finally {
        await Promise.allSettled([
          firstContext.close(),
          returningContext.close(),
          personalContext.close(),
        ]);
      }
    } finally {
      try {
        const cleanup = await request.delete(`/api/organizations/${organization.id}`, {
          ...(ownerAccessToken ? { headers: { authorization: `Bearer ${ownerAccessToken}` } } : {}),
        });
        expect(cleanup.status()).toBe(200);
        await deleteStudioUser(unlinkEmail);
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
