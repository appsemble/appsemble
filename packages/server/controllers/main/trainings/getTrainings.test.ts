import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { setArgv } from '../../../index.js';
import { Organization, OrganizationMember, Training, type User } from '../../../models/index.js';
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
    role: 'Owner',
  });
});

afterAll(() => {
  vi.useRealTimers();
});

describe('getTrainings', () => {
  it('should return a list of all the available trainings', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      description: 'test description',
      competences: ['basics'],
      difficultyLevel: 1,
    });
    await Training.create({
      id: 2,
      title: 'test 2',
      description: 'test description 2',
      competences: ['creativity', 'basics'],
      difficultyLevel: 3,
    });

    authorizeStudio();
    const response = await request.get('/api/main/trainings');
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: 1,
          title: 'test',
          description: 'test description',
          competences: ['basics'],
          difficultyLevel: 1,
        },
        {
          id: 2,
          title: 'test 2',
          description: 'test description 2',
          competences: ['creativity', 'basics'],
          difficultyLevel: 3,
        },
      ],
    });
  });
});
