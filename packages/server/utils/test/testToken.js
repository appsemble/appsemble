import bcrypt from 'bcrypt';
// eslint-disable-next-line import/no-extraneous-dependencies
import request from 'supertest';

export default async function testToken(server, db, scope, organizationId = 'testorganization') {
  const { User, EmailAuthorization, OAuthClient } = db.models;
  const user = await User.create({ password: bcrypt.hashSync('test', 10), name: 'Test User' });
  await user.createOrganization(
    {
      id: organizationId,
      name: 'Test Organization',
    },
    { through: { verified: true } },
  );
  await EmailAuthorization.create({
    email: 'test@example.com',
    verified: true,
    UserId: user.id,
  });
  await user.update({ primaryEmail: 'test@example.com' });
  await OAuthClient.create({ clientId: 'test', clientSecret: 'test', redirectUri: '/' });

  const {
    body: { access_token: token },
  } = await request(server)
    .post('/api/oauth/token')
    .type('form')
    .send({
      grant_type: 'password',
      username: 'test@example.com',
      password: 'test',
      client_id: 'test',
      client_secret: 'test',
      scope,
    });

  return `Bearer ${token}`;
}
