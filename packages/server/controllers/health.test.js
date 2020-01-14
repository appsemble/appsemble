import { createInstance } from 'axios-test-instance';

import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import truncate from '../utils/test/truncate';

describe('checkHealth', () => {
  let db;
  let request;
  let server;

  beforeAll(async () => {
    db = await testSchema('health');
    server = await createServer({ db, argv: { host: window.location, secret: 'test' } });
    request = await createInstance(server);
  }, 10e3);

  beforeEach(async () => {
    await truncate(db);
  });

  afterAll(async () => {
    await request.close();
    await db.close();
  });

  it('should return status ok if all services are connected properly', async () => {
    const response = await request.get('/api/health');

    expect(response).toMatchObject({
      status: 200,
      data: { database: true },
    });
  });

  it('should fail if the database is disconnected', async () => {
    jest.spyOn(db, 'authenticate').mockImplementation(() => Promise.reject(new Error('stub')));
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
