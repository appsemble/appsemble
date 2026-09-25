import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, describe, expect, it } from 'vitest';

import { createServer, setArgv } from '../../../index.js';

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

describe('getTrainingIds', () => {
  it('should return valid training IDs from the bundled catalog', async () => {
    const response = await request.get('/api/trainings');

    expect(response.status).toBe(200);
    expect(response.data).toContain('what-is-appsemble');
  });
});
