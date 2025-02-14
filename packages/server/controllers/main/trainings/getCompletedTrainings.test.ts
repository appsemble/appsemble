import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createServer, createTestUser, setArgv } from '../../../index.js';
import { Training, TrainingCompleted, type User } from '../../../models/index.js';
import { authorizeStudio } from '../../../utils/test/authorization.js';

describe('getCompletedTrainings', () => {
  let user: User;

  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    user = await createTestUser();
  });

  it('should return a list of all training IDs the user has completed', async () => {
    const training = await Training.create({ id: 'test-training-0' });
    await TrainingCompleted.create({ TrainingId: training.id, UserId: user.id });
    authorizeStudio();

    const response = await request.get('/api/trainings/completed');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        "test-training-0",
      ]
    `);
  });

  it('should return an empty array if the user is not logged in', async () => {
    authorizeStudio();

    const response = await request.get('/api/trainings/completed');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      []
    `);
  });
});
