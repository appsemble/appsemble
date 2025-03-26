import { randomBytes } from 'node:crypto';

import { PredefinedAppRole, type TokenResponse } from '@appsemble/types';
import { api } from '@appsemble/utils';
import { request } from 'axios-test-instance';
import { hash } from 'bcrypt';
import { type OpenAPIV3 } from 'openapi-types';

import {
  type App,
  AppMember,
  EmailAuthorization,
  OAuth2ClientCredentials,
  User,
} from '../../models/index.js';
import { createJWTResponse } from '../createJWTResponse.js';

let testUser: User;
let testAppMember: AppMember;

/**
 * Create a new test user.
 *
 * The test user will be used by other test utilities in this module.
 *
 * The test user and authorizations will be reset after each test.
 *
 * @param email The email address to assign to the test user.
 * @returns The test user.
 * @see getTestUser
 */
export async function createTestUser(email = 'test@example.com'): Promise<User> {
  const password = await hash('testpassword', 10);
  testUser = await User.create({
    password,
    name: 'Test User',
    primaryEmail: email,
    timezone: 'Europe/Amsterdam',
  });
  testUser.EmailAuthorizations = [
    await EmailAuthorization.create({ UserId: testUser.id, email, verified: true }),
  ];
  return testUser;
}

/**
 * Create a new test app member.
 *
 * The test app member will be used by other test utilities in this module.
 *
 * The test user and authorizations will be reset after each test.
 *
 * @param appId The id of the app to add the app member to.
 * @param email The email address to assign to the test app member.
 * @param role The role of the app member in the app
 * @returns The test app member.
 * @see getTestAppMember
 */
export async function createTestAppMember(
  appId: number,
  email = 'test@example.com',
  role = PredefinedAppRole.Member,
): Promise<AppMember> {
  const password = await hash('testpassword', 10);
  testAppMember = await AppMember.create({
    AppId: appId,
    email,
    password,
    role,
    name: 'Test App Member',
    primaryEmail: email,
    locale: 'en',
    timezone: 'Europe/Amsterdam',
  });
  return testAppMember;
}

/**
 * Retrieve active user.
 *
 * @returns The test user.
 * @see createTestUser
 */
export function getTestUser(): User {
  return testUser;
}

/**
 * Retrieve active app member.
 *
 * @returns The test app member.
 * @see createTestAppMember
 */
export function getTestAppMember(): AppMember {
  return testAppMember;
}

/**
 * Get an authorization header from an access token response.
 *
 * @param response The access token response to create a bearer authorization header from.
 * @returns A bearer authorization header.
 */
function bearer(response: { access_token: string }): string {
  return `Bearer ${response.access_token}`;
}

/**
 * Authorize the default axios test instance as if it's logged in using an app member.
 *
 * @param app The app to login in.
 * @param appMember The user to login as.
 */
export function authorizeAppMember(app: App, appMember = testAppMember): void {
  const tokens = createJWTResponse(appMember.id, {
    aud: `app:${app.id}`,
    scope: Object.keys(
      (api('').components.securitySchemes.app as OpenAPIV3.OAuth2SecurityScheme).flows
        .authorizationCode.scopes,
    ).join(' '),
  });
  request.defaults.headers.common.authorization = bearer(tokens);
}

/**
 * Authorize the default axios test instance as if its logged in using a client credentials user.
 *
 * @param scope The OAuth2 scopes to assign
 * @param user The user to login as
 * @returns The client credentials model that was created.
 */
export async function authorizeClientCredentials(
  scope: string,
  user = testUser,
): Promise<OAuth2ClientCredentials> {
  const credentials = await OAuth2ClientCredentials.create({
    description: 'Test client',
    id: randomBytes(16).toString('hex'),
    scopes: scope,
    secret: randomBytes(32).toString('hex'),
    UserId: user.id,
  });
  credentials.User = user;
  const tokens = createJWTResponse(user.id, { aud: credentials.id, scope });
  request.defaults.headers.common.authorization = bearer(tokens);
  return credentials;
}

/**
 * Authorize the default axios test instance as if its logged in using an Appsemble studio user.
 *
 * @param user The user to login as
 * @returns The access token response.
 */
export function authorizeStudio(user = testUser): TokenResponse {
  const tokens = createJWTResponse(user.id, { refreshToken: true });
  request.defaults.headers.common.authorization = bearer(tokens);
  return tokens;
}

/**
 * Authorize the default axios test instance as if its using an app SCIM token.
 *
 * @param token The SCIM token to use
 * @returns The SCIM token response.
 */
export function authorizeScim(token: string): string {
  request.defaults.headers.common.authorization = `Bearer ${token}`;
  return token;
}

/**
 * Logout the default axios test instance.
 */
export function unauthorize(): void {
  delete request.defaults.headers.common.authorization;
}

// Reset the test user after every test.
if (process.env.NODE_ENV === 'test') {
  const { afterEach } = await import('vitest');

  afterEach(() => {
    // @ts-expect-error 2322 undefined is not assignable to type (strictNullChecks)
    testUser = undefined;
    unauthorize();
  });
}
