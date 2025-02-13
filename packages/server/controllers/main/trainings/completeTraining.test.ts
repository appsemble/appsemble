import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { setArgv } from '../../../index.js';
import { Training, TrainingCompleted, type User } from '../../../models/index.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

describe('completeTraining', () => {
  let user: User;
  let training: Training;

  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    user = await createTestUser();
    training = await Training.create({ id: 'test-training-0' });
  });

  it('should return 201 created when successfull', async () => {
    authorizeStudio();

    const response = await request.post(`/api/trainings/completed/${training.id}`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: text/plain; charset=utf-8

      Created
    `);
  });

  it('should create a new database entry for the user\'s training "completed" status', async () => {
    authorizeStudio();
    await request.post(`/api/trainings/completed/${training.id}`);

    const response = await request.get('/api/trainings/completed');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        "test-training-0",
      ]
    `);
  });

  it('should return an error if the given training does not exist', async () => {
    authorizeStudio();

    const response = await request.post('/api/trainings/completed/bogus-id');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Training not found",
        "statusCode": 404,
      }
    `);
  });

  it('should return an error if there is already a database entry for this completion status', async () => {
    await TrainingCompleted.create({ TrainingId: training.id, UserId: user.id });
    authorizeStudio();

    const response = await request.post(`/api/trainings/completed/${training.id}`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 409 Conflict
      Content-Type: application/json; charset=utf-8

      {
        "error": "Conflict",
        "message": "Training has already been completed",
        "statusCode": 409,
      }
    `);
  });
});
