import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, describe, expect, it } from 'vitest';

import { setArgv } from '../../../index.js';
import { createServer } from '../../../utils/createServer.js';

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

describe('getAppsembleLanguages', () => {
  it('should return the list of languages appsemble supports', async () => {
    const result = await request('/api/messages');
    expect(result).toMatchObject({ status: 200, data: expect.arrayContaining(['en', 'nl']) });
  });
});
