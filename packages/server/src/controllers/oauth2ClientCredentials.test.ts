import { OAuth2ClientCredentials as OAuth2ClientCredentialsType } from '@appsemble/types';
import { Clock, install } from '@sinonjs/fake-timers';
import { request, setTestApp } from 'axios-test-instance';
import { compare } from 'bcrypt';

import { OAuth2ClientCredentials, User } from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { authorizeStudio, createTestUser } from '../utils/test/authorization';
import { useTestDatabase } from '../utils/test/testSchema';

let clock: Clock;
let user: User;

useTestDatabase('oauth2clientcredentials');

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  clock = install();
  clock.setSystemTime(new Date('2000-01-01T00:00:00Z'));
  user = await createTestUser();
});

afterEach(() => {
  clock.uninstall();
});

describe('registerOAuth2ClientCredentials', () => {
  it('should register OAuth2 client credentials', async () => {
    authorizeStudio();
    const response = await request.post<OAuth2ClientCredentialsType>(
      '/api/oauth2/client-credentials',
      {
        description: 'Test client',
        expires: '2345-01-02T03:04:05Z',
        scopes: ['organizations:write', 'blocks:write'],
      },
    );
    expect(response).toMatchObject({
      status: 201,
      data: {
        created: '2000-01-01T00:00:00.000Z',
        description: 'Test client',
        expires: '2345-01-02T03:04:05.000Z',
        id: expect.stringMatching(/^[\da-z]{32}$/),
        scopes: ['blocks:write', 'organizations:write'],
        secret: expect.stringMatching(/^[\da-z]{64}$/),
      },
    });
    const credentials = await OAuth2ClientCredentials.findOne();
    expect(await compare(response.data.secret, credentials.secret)).toBe(true);
  });

  it('should not allow to create already expired client credentials', async () => {
    authorizeStudio();
    const response = await request.post('/api/oauth2/client-credentials', {
      description: 'Test client',
      expires: '1999-01-02T03:04:05Z',
      scopes: ['organizations:write', 'blocks:write'],
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
    const otherUser = await User.create();
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
      scopes: 'organizations:write',
      secret: 'barSecret',
      UserId: otherUser.id,
    });

    authorizeStudio();
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
      scopes: 'organizations:write',
      secret: 'expiredSecret',
      UserId: user.id,
    });

    authorizeStudio();
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
