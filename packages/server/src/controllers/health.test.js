import { createInstance } from 'axios-test-instance';

import { getDB } from '../models';
import createServer from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';

beforeAll(createTestSchema('health'));

afterEach(truncate);

afterAll(closeTestSchema);

describe('checkHealth', () => {
  let request;
  let server;

  beforeAll(async () => {
    server = await createServer({ argv: { host: 'http://localhost', secret: 'test' } });
    request = await createInstance(server);
  }, 10e3);

  afterAll(async () => {
    await request.close();
  });

  it('should return status ok if all services are connected properly', async () => {
    const response = await request.get('/api/health');

    expect(response).toMatchObject({
      status: 200,
      data: { database: true },
    });
  });

  it('should fail if the database is disconnected', async () => {
    jest.spyOn(getDB(), 'authenticate').mockImplementation(() => Promise.reject(new Error('stub')));
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
