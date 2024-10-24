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

let organization: Organization;
let user: User;

describe('getTrainedUsers', () => {
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

  it('should not fetch users for a non-existent training', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      description: 'Test description',
      difficultyLevel: 3,
      competences: ['basics'],
    });
    await UserTraining.create({
      UserId: user.id,
      TrainingId: 1,
      completed: true,
    });
    authorizeStudio();
    const response = await request.get('/api/trainings/2/users');
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

  it('should fetch the list of all users who have completed a training', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      description: 'Test description',
      difficultyLevel: 3,
      competences: ['basics'],
    });
    const userTraining = await UserTraining.create({
      UserId: user.id,
      TrainingId: 1,
      completed: true,
    });

    const localUser = await createTestUser('test2@email.com');
    await UserTraining.create({
      UserId: localUser.id,
      TrainingId: 1,
      completed: false,
    });
    authorizeStudio();
    const response = await request.get('/api/trainings/1/users');
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: userTraining.id,
          UserId: user.id,
          completed: true,
          User: {
            id: user.id,
            name: user.name,
          },
        },
      ],
    });
  });
});
