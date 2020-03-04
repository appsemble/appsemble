import { createInstance } from 'axios-test-instance';
import lolex from 'lolex';

import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';
import truncate from '../utils/test/truncate';

let authorization;
let clock;
let db;
let request;
let server;
let user;

beforeAll(async () => {
  db = await testSchema('oauth');

  server = await createServer({ db, argv: { host: 'http://localhost', secret: 'test' } });
  request = await createInstance(server);
}, 10e3);

beforeEach(async () => {
  clock = lolex.install();
  clock.setSystemTime(new Date('2000-01-01T00:00:00Z'));
  await truncate(db);
  ({ authorization, user } = await testToken(db));
  request.defaults.headers.authorization = authorization;
});

afterEach(async () => {
  clock.uninstall();
});

afterAll(async () => {
  await request.close();
  await db.close();
});

describe('registerOAuth2ClientCredentials', () => {
  it('should register OAuth2 client credentials', async () => {
    const response = await request.post('/api/oauth2/client-credentials', {
      description: 'Test client',
      expires: '2345-01-02T03:04:05Z',
      scopes: ['organizations:styles:write', 'blocks:write'],
    });
    expect(response).toMatchObject({
      status: 201,
      data: {
        created: '2000-01-01T00:00:00.000Z',
        description: 'Test client',
        expires: '2345-01-02T03:04:05.000Z',
        id: expect.stringMatching(/^[a-z\d]{32}$/),
        scopes: ['blocks:write', 'organizations:styles:write'],
        secret: expect.stringMatching(/^[a-z\d]{64}$/),
      },
    });
  });

  it('should not allow to create already expired client credentials', async () => {
    const response = await request.post('/api/oauth2/client-credentials', {
      description: 'Test client',
      expires: '1999-01-02T03:04:05Z',
      scopes: ['organizations:styles:write', 'blocks:write'],
    });
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'Bad Request',
        message: 'These credentials have already expired',
        statusCode: 400,
      },
    });
  });
});

describe('listOAuth2ClientCredentials', () => {
  it('should list register OAuth2 client credentials for the authenticated user', async () => {
    const { OAuth2ClientCredentials } = db.models;
    const { user: otherUser } = await testToken(db, undefined, 'someone.else@example.com');
    await OAuth2ClientCredentials.create({
      description: 'Test client',
      expires: new Date('2000-02-02T00:00:00Z'),
      id: 'fooId',
      scopes: 'blocks:write',
      secret: 'fooSecret',
      UserId: user.id,
    });
    await OAuth2ClientCredentials.create({
      description: 'Other user’s test client',
      expires: new Date('2000-02-02T00:00:00Z'),
      id: 'barId',
      scopes: 'organizations:styles:write',
      secret: 'barSecret',
      UserId: otherUser.id,
    });

    const response = await request.get('/api/oauth2/client-credentials');
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          created: '2000-01-01T00:00:00.000Z',
          description: 'Test client',
          expires: '2000-02-02T00:00:00.000Z',
          id: 'fooId',
          scopes: ['blocks:write'],
        },
      ],
    });
  });

  it('should omit expired credentials', async () => {
    const { OAuth2ClientCredentials } = db.models;
    await OAuth2ClientCredentials.create({
      description: 'Test client',
      expires: new Date('2000-02-02T00:00:00Z'),
      id: 'validId',
      scopes: 'blocks:write',
      secret: 'validSecret',
      UserId: user.id,
    });
    await OAuth2ClientCredentials.create({
      description: 'Test client',
      expires: new Date('1999-01-01T00:00:00Z'),
      id: 'expiredId',
      scopes: 'organizations:styles:write',
      secret: 'expiredSecret',
      UserId: user.id,
    });

    const response = await request.get('/api/oauth2/client-credentials');
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          created: '2000-01-01T00:00:00.000Z',
          description: 'Test client',
          expires: '2000-02-02T00:00:00.000Z',
          id: 'validId',
          scopes: ['blocks:write'],
        },
      ],
    });
  });
});
