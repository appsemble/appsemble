import { request, setTestApp } from 'axios-test-instance';

import { getDB } from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { useTestDatabase } from '../utils/test/testSchema';

useTestDatabase('health');

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

describe('checkHealth', () => {
  it('should return status ok if all services are connected properly', async () => {
    const response = await request.get('/api/health');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "database": true,
      }
    `);
  });

  it('should fail if the database is disconnected', async () => {
    jest.spyOn(getDB(), 'authenticate').mockRejectedValue(new Error('stub'));
    const response = await request.get('/api/health');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 503 Service Unavailable
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "database": false,
        },
        "error": "Service Unavailable",
        "message": "API unhealthy",
        "statusCode": 503,
      }
    `);
  });
});
