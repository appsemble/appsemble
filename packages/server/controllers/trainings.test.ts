import { createFormData } from '@appsemble/node-utils';
import {
  type TrainingBlock as TrainingBlockType,
  type Training as TrainingType,
} from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { setArgv } from '../index.js';
import {
  Organization,
  OrganizationMember,
  Training,
  TrainingBlock,
  type User,
  UserTraining,
} from '../models/index.js';
import { createServer } from '../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let organization: Organization;
let user: User;

beforeAll(async () => {
  vi.useFakeTimers();
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  setTestApp(server);
});

useTestDatabase(import.meta);

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
    const response = await request.get('/api/trainings');
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

describe('createTraining', () => {
  it('should not allow anyone without enough permissions to create trainings', async () => {
    await OrganizationMember.update({ role: 'Member' }, { where: { UserId: user.id } });
    authorizeStudio();
    const response = await request.post<TrainingType>('/api/trainings', {
      title: 'test',
      description: 'test description',
      competences: ['basics'],
      difficultyLevel: 2,
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should not allow anyone outside of appsemble organization to create trainings', async () => {
    await Organization.create({
      id: 'test',
      name: 'test organization',
    });
    await OrganizationMember.update({ OrganizationId: 'test' }, { where: { UserId: user.id } });
    authorizeStudio();
    const response = await request.post<TrainingType>('/api/trainings', {
      title: 'test',
      description: 'test description',
      competences: ['basics'],
      difficultyLevel: 2,
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User is not part of this organization.",
        "statusCode": 403,
      }
    `);
  });

  it('should allow a user with sufficient permissions to create trainings', async () => {
    authorizeStudio();
    const response = await request.post<TrainingType>('/api/trainings', {
      title: 'test',
      description: 'test description',
      competences: ['basics'],
      difficultyLevel: 2,
    });
    expect(response.status).toBe(201);
    const training = await request.get('/api/trainings/1');
    expect(training).toMatchObject({
      status: 200,
      data: {
        id: 1,
        title: 'test',
        description: 'test description',
        competences: ['basics'],
        difficultyLevel: 2,
      },
    });
  });
});

describe('deleteTraining', () => {
  it('should not allow anyone without sufficient permissions to delete trainings', async () => {
    await OrganizationMember.update({ role: 'Member' }, { where: { UserId: user.id } });
    await Training.create({
      id: 1,
      title: 'test',
      description: 'test description',
      competences: ['basics'],
      difficultyLevel: 1,
    });
    authorizeStudio();
    const response = await request.delete('/api/trainings/1');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should allow a user with sufficient permissions to delete trainings', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      description: 'test description',
      competences: ['basics'],
      difficultyLevel: 1,
    });
    authorizeStudio();
    const response = await request.delete('/api/trainings/1');
    expect(response.status).toBe(204);
    const training = await request.get('/api/trainings/1');
    expect(training).toMatchInlineSnapshot(`
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

describe('patchTraining', () => {
  it('should not allow user with insufficient permissions to edit a training', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      description: 'test description',
      competences: ['basics'],
      difficultyLevel: 2,
    });
    await OrganizationMember.update({ role: 'Member' }, { where: { UserId: user.id } });
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
          "message": "User does not have sufficient permissions.",
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
          "message": "User is not part of this organization.",
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
        "message": "User does not have sufficient permissions.",
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
        "message": "User is not part of this organization.",
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
      `/api/training/blocks/${block.id}`,
      createFormData({
        documentationLink: 'https://appsemble.app/en/docs',
      }),
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
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
      `/api/training/blocks/${block.id}`,
      createFormData({
        documentationLink: 'https://appsemble.app/en/docs',
      }),
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User is not part of this organization.",
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
      `/api/training/blocks/${block.id}`,
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
    const response = await request.delete(`/api/training/blocks/${block1.id}`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
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
    const response = await request.delete(`/api/training/blocks/${block1.id}`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User is not part of this organization.",
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
    const response = await request.delete(`/api/training/blocks/${block1.id}`);
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

describe('enrollUserInTraining', () => {
  it('should not allow user to enroll in a training that does not exist', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      competences: ['basics'],
      difficultyLevel: 4,
    });

    authorizeStudio();
    const response = await request.post('/api/trainings/2/enroll');
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
    const response = await request.post('/api/trainings/1/enroll');
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
    const response = await request.post('/api/trainings/1/enroll');
    expect(response.status).toBe(201);
  });
});

describe('updateTrainingCompletionStatus', () => {
  it("should not allow updating a training that doesn't exist", async () => {
    await Training.create({
      id: 1,
      title: 'test',
      competences: ['basics'],
      difficultyLevel: 3,
    });

    authorizeStudio();
    const response = await request.patch(
      '/api/trainings/2/enroll',
      createFormData({
        completed: true,
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

  it('should allow user to update the training completion status', async () => {
    await Training.create({
      id: 1,
      title: 'test',
      competences: ['basics'],
      difficultyLevel: 3,
    });

    const userTraining = await UserTraining.create({
      UserId: user.id,
      TrainingId: 1,
      completed: false,
    });

    authorizeStudio();
    const response = await request.patch(
      '/api/trainings/1/enroll',
      createFormData({
        completed: true,
      }),
    );
    expect(response.status).toBe(200);

    const userTrainings = await UserTraining.findAll({
      where: { TrainingId: 1 },
    });
    expect(userTrainings).toMatchObject([
      {
        id: userTraining.id,
        TrainingId: 1,
        UserId: user.id,
        completed: true,
      },
    ]);
  });
});

describe('getTrainedUsers', () => {
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
    const response = await request.get('/api/trainings/2/enroll/users');
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
    const response = await request.get('/api/trainings/1/enroll/users');
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

describe('isUserEnrolled', () => {
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
    const response = await request.get('/api/trainings/1/enroll');
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
    const response = await request.get('/api/trainings/1/enroll');
    expect(response).toMatchObject({
      status: 200,
      data: {
        enrolled: true,
      },
    });
  });
});
