import { randomBytes } from 'crypto';

import { TokenResponse } from '@appsemble/types';
import { api } from '@appsemble/utils';
import { request } from 'axios-test-instance';
import { hash } from 'bcrypt';
import { OpenAPIV3 } from 'openapi-types';

import { App, EmailAuthorization, OAuth2ClientCredentials, User } from '../../models';
import { createJWTResponse } from '../createJWTResponse';

let testUser: User;

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
  testUser = await User.create({ password, name: 'Test User', primaryEmail: email });
  testUser.EmailAuthorizations = [
    await EmailAuthorization.create({ UserId: testUser.id, email, verified: true }),
  ];
  return testUser;
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
 * Get an authorization header from an access token response.
 *
 * @param response The access token response to create a bearer authorization header from.
 * @returns A bearer authorization header.
 */
function bearer(response: { access_token: string }): string {
  return `Bearer ${response.access_token}`;
}

/**
 * Authorize the default axios test instance as if its logged in using an app user.
 *
 * @param app The app to login as.
 * @param user The user to login as.
 */
export function authorizeApp(app: App, user = testUser): void {
  const tokens = createJWTResponse(user.id, {
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
 * Logout the default axios test instance.
 */
export function unauthorize(): void {
  delete request.defaults.headers.common.authorization;
}

// Reset the test user after every test.
afterEach(() => {
  testUser = undefined;
  unauthorize();
});
