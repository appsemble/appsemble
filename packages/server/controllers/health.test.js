import request from 'supertest';

import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import truncate from '../utils/test/truncate';

describe('app controller', () => {
  let db;
  let server;

  beforeAll(async () => {
    db = await testSchema('health');
    server = await createServer({ db });
  }, 10e3);

  beforeEach(async () => {
    await truncate(db);
  });

  afterAll(async () => {
    await db.close();
  });

  it('should return status ok if all services are connected properly', async () => {
    const response = await request(server).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ database: true });
  });

  it('should fail if the database is disconnected', async () => {
    jest.spyOn(db, 'authenticate').mockImplementation(() => Promise.reject(new Error('stub')));
    const response = await request(server).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body).toStrictEqual({
      statusCode: 503,
      message: 'API unhealthy',
      error: 'Service Unavailable',
      data: {
        database: false,
      },
    });
  });
});
