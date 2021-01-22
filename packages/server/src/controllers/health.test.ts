import { request, setTestApp } from 'axios-test-instance';

import { getDB } from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';

beforeAll(createTestSchema('health'));

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

afterEach(truncate);

afterAll(closeTestSchema);

describe('checkHealth', () => {
  it('should return status ok if all services are connected properly', async () => {
    const response = await request.get('/api/health');

    expect(response).toMatchObject({
      status: 200,
      data: { database: true },
    });
  });

  it('should fail if the database is disconnected', async () => {
    jest.spyOn(getDB(), 'authenticate').mockRejectedValue(new Error('stub'));
    const response = await request.get('/api/health');

    expect(response).toMatchObject({
      status: 503,
      data: {
        statusCode: 503,
        message: 'API unhealthy',
        error: 'Service Unavailable',
        data: {
          database: false,
        },
      },
    });
  });
});
