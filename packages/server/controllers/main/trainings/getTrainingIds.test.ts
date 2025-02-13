import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, describe, expect, it } from 'vitest';

import { createServer, setArgv } from '../../../index.js';
import { Training } from '../../../models/index.js';

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

describe('getTrainingIds', () => {
  it('should return a list of all training ids', async () => {
    await Training.create({ id: 'test-training-0' });
    const response = await request.get('/api/trainings');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        "test-training-0",
      ]
    `);
  });
});
