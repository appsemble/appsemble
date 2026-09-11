import { version } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, describe, expect, it } from 'vitest';

import { setArgv } from './argv.js';
import { createServer } from './createServer.js';

describe('createServer', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    await setTestApp(await createServer());
  });

  it('should expose the Appsemble version for cross-origin HEAD requests', async () => {
    const response = await request.head('/api', {
      headers: { Origin: 'https://example.com' },
    });

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('https://example.com');
    expect(response.headers['x-appsemble-version']).toBe(version);
  });
});
