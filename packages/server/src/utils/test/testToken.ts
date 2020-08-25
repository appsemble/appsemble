import { randomBytes } from 'crypto';

import { hash } from 'bcrypt';

import { EmailAuthorization, OAuth2ClientCredentials, User } from '../../models';
import { createJWTResponse } from '../createJWTResponse';

interface TestTokenResult {
  user: User;
  authorization: string;
  refreshToken: string;
  clientToken?: string;
}

export async function testToken(
  scope?: string,
  email = 'test@example.com',
): Promise<TestTokenResult> {
  const password = await hash('testpassword', 10);
  const argv = { host: 'http://localhost', secret: 'test' };
  const user = await User.create({ password, name: 'Test User', primaryEmail: email });
  await EmailAuthorization.create({ UserId: user.id, email, verified: true });
  const response = createJWTResponse(user.id, argv, { refreshToken: true });
  const result: TestTokenResult = {
    user,
    authorization: `Bearer ${response.access_token}`,
    refreshToken: response.refresh_token,
  };
  if (scope) {
    const { id } = await OAuth2ClientCredentials.create({
      description: 'Test client',
      id: randomBytes(16).toString('hex'),
      scopes: scope,
      secret: randomBytes(32).toString('hex'),
      UserId: user.id,
    });
    result.clientToken = createJWTResponse(user.id, argv, { aud: id, scope }).access_token;
  }
  return result;
}
