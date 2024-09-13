import { createFormData } from '@appsemble/node-utils';
import {
  PredefinedOrganizationRole,
  type TrainingBlock as TrainingBlockType,
} from '@appsemble/types';
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

describe('patchTrainingBlock', () => {
  it('should not allow user with insufficient permissions to update training blocks', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      competences: ['basics'],
      difficultyLevel: 4,
    });
    const block = await TrainingBlock.create({
      title: 'testblock',
      TrainingId: 1,
    });
    await OrganizationMember.update({ role: 'Member' }, { where: { UserId: user.id } });

    authorizeStudio();
    const response = await request.patch<TrainingBlockType>(
      `/api/training-blocks/${block.id}`,
      createFormData({
        documentationLink: 'https://appsemble.app/en/docs',
      }),
    );
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

  it('should not allow anyone outside of appsemble organization to update training blocks', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      competences: ['basics'],
      difficultyLevel: 4,
    });

    await Organization.create({
      id: 'testorg',
      name: 'Test Organization',
    });
    const block = await TrainingBlock.create({
      title: 'testblock',
      TrainingId: 1,
    });
    await OrganizationMember.update({ OrganizationId: 'testorg' }, { where: { UserId: user.id } });

    authorizeStudio();
    const response = await request.patch<TrainingBlockType>(
      `/api/training-blocks/${block.id}`,
      createFormData({
        documentationLink: 'https://appsemble.app/en/docs',
      }),
    );
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

  it('should allow users with right permissions to update training blocks', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      competences: ['basics'],
      difficultyLevel: 4,
    });
    const block = await TrainingBlock.create({
      title: 'testblock',
      TrainingId: 1,
    });

    authorizeStudio();
    const response = await request.patch<TrainingBlockType>(
      `/api/training-blocks/${block.id}`,
      createFormData({
        documentationLink: 'https://appsemble.app/en/docs',
      }),
    );

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: String(block.id),
        documentationLink: 'https://appsemble.app/en/docs',
      },
    });
  });
});
