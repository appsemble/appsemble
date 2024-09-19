import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { setArgv } from '../../../../index.js';
import {
  Organization,
  OrganizationMember,
  Training,
  TrainingBlock,
  type User,
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

describe('getTrainingBlocksByTrainingId', () => {
  it('should return all blocks associated with a training', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      description: 'test description',
      competences: ['analyze'],
      difficultyLevel: 5,
    });

    const block1 = await TrainingBlock.create({
      title: 'test block 1',
      TrainingId: 1,
      documentationLink: 'https://www.appsemble.app/en/docs/',
    });

    const block2 = await TrainingBlock.create({
      title: 'test block 2',
      TrainingId: 1,
      documentationLink: 'https://www.appsemble.app/docs/',
    });
    authorizeStudio();

    const response = await request.get('/api/trainings/1/blocks');
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: String(block1.id),
          title: 'test block 1',
          TrainingId: 1,
          documentationLink: 'https://www.appsemble.app/en/docs/',
        },
        {
          id: String(block2.id),
          title: 'test block 2',
          TrainingId: 1,
          documentationLink: 'https://www.appsemble.app/docs/',
        },
      ],
    });
  });
});
