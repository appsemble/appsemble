export default async function testToken(request, server, db, scope) {
  const { User, EmailAuthorization, OAuthClient } = db;
  const user = await User.create();
  await EmailAuthorization.create({
    email: 'test',
    password: '$2y$10$f8nyh7yIV7SsSI.jFbU3KeCjnGNjLODU/b.ZjxsZY20Uz3Y84bqKS',
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
