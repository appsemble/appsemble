import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { setArgv } from '../../../../index.js';
import {
  Organization,
  OrganizationMember,
  Training,
  type User,
  UserTraining,
} from '../../../../models/index.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../utils/test/testSchema.js';

useTestDatabase(import.meta);

let organization: Organization;
let user: User;

beforeAll(async () => {
  vi.useFakeTimers();
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  setTestApp(server);
});

beforeEach(async () => {
  vi.clearAllTimers();
  vi.setSystemTime(0);

  user = await createTestUser();
  organization = await Organization.create({
    id: 'appsemble',
    name: 'Appsemble',
  });
  await OrganizationMember.create({
    OrganizationId: organization.id,
    UserId: user.id,
    role: PredefinedOrganizationRole.Owner,
  });
});

afterAll(() => {
  vi.useRealTimers();
});

describe('enrollCurrentUserInTraining', () => {
  it('should not allow user to enroll in a training that does not exist', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      competences: ['basics'],
      difficultyLevel: 4,
    });

    authorizeStudio();
    const response = await request.post('/api/trainings/2/users/current');
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

  it('should not allow user to enroll in a training that they are already enrolled in', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      competences: ['basics'],
      difficultyLevel: 3,
    });

    await UserTraining.create({
      UserId: user.id,
      TrainingId: 1,
      completed: false,
    });

    authorizeStudio();
    const response = await request.post('/api/trainings/1/users/current');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "User is already enrolled in this training",
        "statusCode": 400,
      }
    `);
  });

  it('should allow user to enroll in a training', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      competences: ['basics'],
      difficultyLevel: 4,
    });

    authorizeStudio();
    const response = await request.post('/api/trainings/1/users/current');
    expect(response.status).toBe(201);
  });
});
