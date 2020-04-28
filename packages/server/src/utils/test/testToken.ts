import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

import { EmailAuthorization, OAuth2ClientCredentials, User } from '../../models';
import createJWTResponse from '../createJWTResponse';

const password = bcrypt.hashSync('testpassword', 10);

interface TestTokenResult {
  user: User;
  authorization: string;
  refreshToken: string;
  clientToken?: string;
}

export default async function testToken(
  scope: string,
  email = 'test@example.com',
): Promise<TestTokenResult> {
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
