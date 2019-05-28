import bcrypt from 'bcrypt';

export default async function testToken(
  request,
  server,
  db,
  scope,
  organizationId = 'testorganization',
) {
  const { User, EmailAuthorization, OAuthClient } = db.models;
  const user = await User.create();
  await user.createOrganization({
    id: organizationId,
    password: bcrypt.hashSync('test', 10),
    name: 'Test User',
  });
  await EmailAuthorization.create({
    email: 'test@example.com',
    verified: true,
    UserId: user.id,
  });
  await OAuthClient.create({ clientId: 'test', clientSecret: 'test', redirectUri: '/' });
  const {
    body: { access_token: token },
  } = await request(server)
    .post('/api/oauth/token')
    .type('form')
    .send({
      grant_type: 'password',
      username: 'test',
      password: 'test',
      client_id: 'test',
      client_secret: 'test',
      scope,
    });

  return `Bearer ${token}`;
}
