import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { expect, it } from 'vitest';

import { authenticate } from './authentication.js';

it('should send the access token of the latest client credentials to a remote', async () => {
  const mock = new MockAdapter(axios as ConstructorParameters<typeof MockAdapter>[0]);
  mock.onPost('/auth/oauth2/token').reply(({ headers }) => {
    const [type, credentials] = String(headers!.authorization).split(' ');
    return type === 'Basic'
      ? [200, { access_token: `token of ${Buffer.from(credentials, 'base64').toString()}` }]
      : [401];
  });
  let authorization: unknown;
  mock.onGet('/api/user').reply(({ headers }) => {
    authorization = headers!.authorization;
    return [200];
  });

  await authenticate('http://localhost', 'apps:write', 'first:secret');
  await authenticate('http://localhost', 'apps:write', 'second:secret');
  await axios.get('/api/user', { baseURL: 'http://localhost' });

  expect(authorization).toBe('Bearer token of second:secret');
});
