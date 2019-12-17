import { createInstance } from 'axios-test-instance';
import { verify } from 'jsonwebtoken';
import lolex from 'lolex';

import createServer from '../../utils/createServer';
import testSchema from '../../utils/test/testSchema';
import testToken from '../../utils/test/testToken';
import truncate from '../../utils/test/truncate';

let clock;
let db;
let request;
let server;
let user;

beforeAll(async () => {
  db = await testSchema('oauth');

  server = await createServer({ db, argv: { host: window.location, secret: 'test' } });
  request = await createInstance(server);
}, 10e3);

beforeEach(async () => {
  clock = lolex.install();
  clock.setSystemTime(new Date('2000-01-01T00:00:00Z'));
  await truncate(db);
  ({ user } = await testToken(db));
});

afterEach(async () => {
  clock.uninstall();
});

afterAll(async () => {
  await request.close();
  await db.close();
});

it('should not accept invalid content types', async () => {
  const response = await request.post('/oauth2/token', {});
  expect(response).toMatchObject({
    status: 400,
    data: {
      error: 'invalid_request',
    },
  });
});

it('should not accept missing grant types', async () => {
  const response = await request.post('/oauth2/token', '');
  expect(response).toMatchObject({
    status: 400,
    data: {
      error: 'unsupported_grant_type',
    },
  });
});

it('should not accept unsupported grant types', async () => {
  const response = await request.post('/oauth2/token', 'grant_type=unsupported');
  expect(response).toMatchObject({
    status: 400,
    data: {
      error: 'unsupported_grant_type',
    },
  });
});

describe('client_credentials', () => {
  beforeEach(async () => {
    await db.models.OAuth2ClientCredentials.create({
      description: 'Test credentials',
      id: 'testClientId',
      expires: new Date('2000-01-02T00:00:00Z'),
      scopes: 'blocks:write',
      secret: 'testClientSecret',
      UserId: user.id,
    });
  });

  it('should handle a missing authorization header', async () => {
    const response = await request.post('/oauth2/token', 'grant_type=client_credentials');
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_client',
      },
    });
  });

  it('should handle invalid authentication types', async () => {
    const response = await request.post('/oauth2/token', 'grant_type=client_credentials', {
      headers: {
        authorization: 'Bearer foo',
      },
    });
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_client',
      },
    });
  });

  it('should handle invalidly encoded basic authentication', async () => {
    const response = await request.post('/oauth2/token', 'grant_type=client_credentials', {
      headers: {
        authorization: 'Basic invalid',
      },
    });
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_client',
      },
    });
  });

  it('should handle invalid client credentials', async () => {
    const response = await request.post('/oauth2/token', 'grant_type=client_credentials', {
      headers: {
        authorization: `Basic ${Buffer.from('invalidId:invalidSecret').toString('base64')}`,
      },
    });
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_client',
      },
    });
  });

  it('should handle expired clients', async () => {
    clock.setSystemTime(new Date('2000-03-01T00:00:00Z'));
    const response = await request.post('/oauth2/token', 'grant_type=client_credentials', {
      headers: {
        authorization: `Basic ${Buffer.from('testClientId:testClientSecret').toString('base64')}`,
      },
    });
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_grant',
      },
    });
  });

  it('should handle unauthorized client scopes', async () => {
    const response = await request.post(
      '/oauth2/token',
      'grant_type=client_credentials&scope=blocks:write organizations:styles:write',
      {
        headers: {
          authorization: `Basic ${Buffer.from('testClientId:testClientSecret').toString('base64')}`,
        },
      },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_scope',
      },
    });
  });

  it('should return an access token response if the request is made correctly', async () => {
    const response = await request.post(
      '/oauth2/token',
      'grant_type=client_credentials&scope=blocks:write',
      {
        headers: {
          authorization: `Basic ${Buffer.from('testClientId:testClientSecret').toString('base64')}`,
        },
      },
    );
    expect(response).toMatchObject({
      status: 200,
      data: {
        access_token: expect.stringMatching(/^\w+\.\w+\.\w+$/),
        expires_in: 3600,
        token_type: 'bearer',
      },
    });
    expect(() => verify(response.data.access_token, 'test', { aud: 'testClientId' })).not.toThrow();
  });
});
