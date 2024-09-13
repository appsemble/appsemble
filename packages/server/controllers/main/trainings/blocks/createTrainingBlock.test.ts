import { createFormData } from '@appsemble/node-utils';
import {
  PredefinedOrganizationRole,
  type TrainingBlock as TrainingBlockType,
} from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { setArgv } from '../../../../index.js';
import { Organization, OrganizationMember, Training, type User } from '../../../../models/index.js';
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

describe('createTrainingBlock', () => {
  it('should not allow anyone without enough permissions to create training blocks', async () => {
    await OrganizationMember.update({ role: 'Member' }, { where: { UserId: user.id } });
    await Training.create({
      id: 1,
      title: 'test',
      description: 'test description',
      competences: ['basics'],
      difficultyLevel: 2,
    });

    authorizeStudio();
    const response = await request.post<TrainingBlockType>(
      '/api/trainings/1/blocks',
      createFormData({
        title: 'test block',
        documentationLink: 'https://www.appsemble.app/en/docs/',
        videoLink: 'https://www.youtube.com/test-video',
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

  it('should not allow anyone outside of appsemble organization to create training blocks', async () => {
    await Organization.create({
      id: 'test',
      name: 'test organization',
    });
    await Training.create({
      id: 1,
      title: 'test',
      description: 'test description',
      competences: ['basics'],
      difficultyLevel: 2,
    });
    await OrganizationMember.update({ OrganizationId: 'test' }, { where: { UserId: user.id } });
    authorizeStudio();
    const response = await request.post<TrainingBlockType>(
      '/api/trainings/1/blocks',
      createFormData({
        title: 'test block',
        documentationLink: 'https://www.appsemble.app/en/docs/',
        videoLink: 'https://www.youtube.com/test-video',
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

  it('should allow a user with sufficient permissions to create training blocks', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      description: 'test description',
      competences: ['basics'],
      difficultyLevel: 2,
    });
    authorizeStudio();
    const response = await request.post<TrainingBlockType>(
      '/api/trainings/1/blocks',
      createFormData({
        title: 'test block',
        documentationLink: 'https://www.appsemble.app/en/docs/',
        videoLink: 'https://www.youtube.com/test-video',
      }),
    );
    expect(response.status).toBe(201);
    const training = await request.get('/api/trainings/1/blocks');
    expect(training).toMatchObject({
      status: 200,
      data: [
        {
          title: 'test block',
          TrainingId: 1,
          documentationLink: 'https://www.appsemble.app/en/docs/',
          videoLink: 'https://www.youtube.com/test-video',
        },
      ],
    });
  });

  it('should not allow a user to create training blocks for non existent training', async () => {
    authorizeStudio();
    const response = await request.post<TrainingBlockType>(
      '/api/trainings/1/blocks',
      createFormData({
        title: 'test block',
        documentationLink: 'https://www.appsemble.app/en/docs/',
        videoLink: 'https://www.youtube.com/test-video',
      }),
    );
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
});
