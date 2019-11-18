import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

import createJWTResponse from '../createJWTResponse';

const password = bcrypt.hashSync('testpassword', 10);

export default async function testToken(
  { models: { OAuth2ClientCredentials, User } },
  scope,
  email = 'test@example.com',
) {
  const argv = { host: window.location, secret: 'test' };
  const user = await User.create({ password, name: 'Test User', primaryEmail: email });
  await user.createEmailAuthorization({ email, verified: true });
  const response = createJWTResponse(user.id, argv);
  const result = {
    user,
    authorization: `Bearer ${response.access_token}`,
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
