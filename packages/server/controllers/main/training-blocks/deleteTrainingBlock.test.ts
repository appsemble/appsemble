import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { setArgv } from '../../../index.js';
import {
  Organization,
  OrganizationMember,
  Training,
  TrainingBlock,
  type User,
} from '../../../models/index.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../utils/test/testSchema.js';

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

describe('deleteTrainingBlock', () => {
  it('should not allow anyone without sufficient permissions to delete training blocks', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      competences: ['basics'],
      difficultyLevel: 4,
    });

    const block1 = await TrainingBlock.create({
      TrainingId: 1,
      title: 'test block 1',
    });

    OrganizationMember.update({ role: 'Member' }, { where: { UserId: user.id } });

    authorizeStudio();
    const response = await request.delete(`/api/training-blocks/${block1.id}`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient organization permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should not allow anyone outside of appsemble organization to delete training blocks', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      competences: ['basics'],
      difficultyLevel: 4,
    });

    const block1 = await TrainingBlock.create({
      TrainingId: 1,
      title: 'test block 1',
    });

    await Organization.create({
      id: 'testorg',
      name: 'Test Organization',
    });

    OrganizationMember.update({ OrganizationId: 'testorg' }, { where: { UserId: user.id } });

    authorizeStudio();
    const response = await request.delete(`/api/training-blocks/${block1.id}`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User is not a member of this organization.",
        "statusCode": 403,
      }
    `);
  });

  it('should allow users with sufficient permissions to delete training blocks', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      competences: ['basics'],
      difficultyLevel: 4,
    });

    const block1 = await TrainingBlock.create({
      TrainingId: 1,
      title: 'test block 1',
    });

    const block2 = await TrainingBlock.create({
      TrainingId: 1,
      title: 'test block 2',
    });

    authorizeStudio();
    const response = await request.delete(`/api/training-blocks/${block1.id}`);
    expect(response.status).toBe(204);

    const trainingBlocks = await request.get('/api/trainings/1/blocks');
    expect(trainingBlocks).toMatchObject({
      status: 200,
      data: [
        {
          id: block2.id,
          TrainingId: 1,
          title: 'test block 2',
        },
      ],
    });
  });
});
