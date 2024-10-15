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

describe('isCurrentUserEnrolledInTraining', () => {
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

  it('should return false if user is not enrolled in a training', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      description: 'Test description',
      difficultyLevel: 3,
      competences: ['basics'],
    });

    await createTestUser('test2@email.com');
    await UserTraining.create({
      UserId: user.id,
      TrainingId: 1,
      completed: false,
    });
    authorizeStudio();
    const response = await request.get('/api/trainings/1/users/current');
    expect(response).toMatchObject({
      status: 200,
      data: {
        enrolled: false,
      },
    });
  });

  it('should return true if user is not enrolled in a training', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      description: 'Test description',
      difficultyLevel: 3,
      competences: ['basics'],
    });

    const localUser = await createTestUser('test2@email.com');
    await UserTraining.create({
      UserId: localUser.id,
      TrainingId: 1,
      completed: false,
    });
    authorizeStudio();
    const response = await request.get('/api/trainings/1/users/current');
    expect(response).toMatchObject({
      status: 200,
      data: {
        enrolled: true,
      },
    });
  });
});
