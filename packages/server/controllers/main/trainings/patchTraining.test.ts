import { createFormData } from '@appsemble/node-utils';
import { PredefinedOrganizationRole, type Training as TrainingType } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { setArgv } from '../../../index.js';
import { Organization, OrganizationMember, Training, type User } from '../../../models/index.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

let organization: Organization;
let user: User;

describe('patchTraining', () => {
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

  it('should not allow user with insufficient permissions to edit a training', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      description: 'test description',
      competences: ['basics'],
      difficultyLevel: 2,
    });
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.Member },
      { where: { UserId: user.id } },
    );
    authorizeStudio();

    const response = await request.patch<TrainingType>(
      '/api/trainings/1',
      createFormData({
        title: 'test5',
      }),
    );
    expect(response).toMatchInlineSnapshot(
      `
        HTTP/1.1 403 Forbidden
        Content-Type: application/json; charset=utf-8

        {
          "error": "Forbidden",
          "message": "User does not have sufficient organization permissions.",
          "statusCode": 403,
        }
      `,
    );
  });

  it('should not allow user outside of appsemble to update a training', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      description: 'test description',
      competences: ['basics'],
      difficultyLevel: 2,
    });
    await Organization.create({
      id: 'testorg',
      name: 'Test Organization',
    });
    await OrganizationMember.update({ OrganizationId: 'testorg' }, { where: { UserId: user.id } });
    authorizeStudio();

    const response = await request.patch<TrainingType>(
      '/api/trainings/1',
      createFormData({
        title: 'test5',
      }),
    );
    expect(response).toMatchInlineSnapshot(
      `
        HTTP/1.1 403 Forbidden
        Content-Type: application/json; charset=utf-8

        {
          "error": "Forbidden",
          "message": "User is not a member of this organization.",
          "statusCode": 403,
        }
      `,
    );
  });

  it('should update the training when user has sufficient permissions', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      description: 'test description',
      competences: ['basics'],
      difficultyLevel: 4,
    });

    authorizeStudio();

    const formData = createFormData({
      title: 'test 2',
      description: 'Updated description',
      difficultyLevel: 3,
      competences: JSON.stringify(['basics', 'analyze']),
    });
    const response = await request.patch<TrainingType>('/api/trainings/1', formData);
    expect(response).toMatchObject({
      status: 200,
      data: {
        id: 1,
        title: 'test 2',
        description: 'Updated description',
        competences: ['basics', 'analyze'],
        difficultyLevel: 3,
      },
    });
  });
});
