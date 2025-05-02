import {
  createFixtureStream,
  getS3FileBuffer,
  readFixture,
  uploadS3File,
} from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

let organization: Organization;
let user: User;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('reseedDemoApp', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv(argv);
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
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

  it('should throw on non existing app', async () => {
    authorizeStudio();
    await App.create({
      demoMode: true,
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const response = await request.post(`/api/apps/${2}/reseed`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App not found",
        "statusCode": 404,
      }
    `);
  });

  it('should throw on non demo app', async () => {
    authorizeStudio();
    const { id } = await App.create({
      demoMode: false,
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const response = await request.post(`/api/apps/${id}/reseed`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "App is not in demo mode",
        "statusCode": 400,
      }
    `);
  });

  it('should reseed resources and assets with undefined user properties', async () => {
    vi.useRealTimers();
    authorizeStudio();
    const { id: appId } = await App.create({
      demoMode: true,
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const { Asset, Resource } = await getAppDB(1);
    const { id: seedResourceId } = await Resource.create({
      type: 'tasks',
      seed: true,
      data: {
        foo: 'bar',
      },
    });

    const { id: ephemeralResourceId } = await Resource.create({
      type: 'tasks',
      ephemeral: true,
      data: {
        foo: 'bar',
      },
    });

    const { id: seedAssetId } = await Asset.create({
      name: 'tasks',
      seed: true,
    });
    await uploadS3File(`app-${appId}`, seedAssetId, createFixtureStream('standing.png'));

    const { id: ephemeralAssetId } = await Asset.create({
      name: 'tasks',
      ephemeral: true,
    });
    await uploadS3File(`app-${appId}`, ephemeralAssetId, createFixtureStream('standing.png'));

    await request.post(`/api/apps/${appId}/reseed`);

    const seedResource = await Resource.findOne({
      where: {
        id: seedResourceId,
        seed: true,
      },
    });

    expect(seedResource).toStrictEqual(
      expect.objectContaining({
        id: 1,
        data: { foo: 'bar' },
      }),
    );

    const oldEphemeralResource = await Resource.findOne({
      where: {
        id: ephemeralResourceId,
      },
    });

    expect(oldEphemeralResource).toBeNull();

    const newEphemeralResource = await Resource.findOne({
      where: {
        ephemeral: true,
      },
    });

    expect(newEphemeralResource).toStrictEqual(
      expect.objectContaining({
        id: 3,
        data: { foo: 'bar' },
        ephemeral: true,
      }),
    );

    const seedAsset = await Asset.findOne({
      attributes: ['name', 'seed', 'ephemeral'],
      where: {
        id: seedAssetId,
        seed: true,
      },
    });

    expect(seedAsset).toStrictEqual(
      expect.objectContaining({
        name: 'tasks',
        seed: true,
        ephemeral: false,
      }),
    );
    expect(await getS3FileBuffer(`app-${appId}`, seedAssetId)).toStrictEqual(
      await readFixture('standing.png'),
    );

    const oldEphemeralAsset = await Asset.findOne({
      where: {
        id: ephemeralAssetId,
      },
    });

    expect(oldEphemeralAsset).toBeNull();
    expect(await getS3FileBuffer(`app-${appId}`, ephemeralAssetId)).toBeNull();

    const newEphemeralAsset = (await Asset.findOne({
      attributes: ['id', 'name', 'seed', 'ephemeral'],
      where: {
        ephemeral: true,
      },
    }))!;

    expect(newEphemeralAsset).toStrictEqual(
      expect.objectContaining({
        name: 'tasks',
        seed: false,
        ephemeral: true,
      }),
    );
    expect(await getS3FileBuffer(`app-${appId}`, newEphemeralAsset.id)).toStrictEqual(
      await readFixture('standing.png'),
    );
  });

  it('should reseed resources and assets with defined user properties', async () => {
    vi.useRealTimers();
    authorizeStudio();
    const { id: appId } = await App.create({
      demoMode: true,
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        members: {
          properties: {
            completedTasks: {
              schema: { type: 'array', items: { type: 'integer' } },
              reference: { resource: 'tasks' },
            },
            lastCompletedTask: {
              schema: { type: 'integer' },
              reference: { resource: 'tasks' },
            },
          },
        },
        resources: {
          tasks: {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
              },
            },
          },
        },
      },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const { AppMember, Asset, Resource } = await getAppDB(1);
    await Resource.create({
      type: 'tasks',
      seed: true,
      data: {
        foo: 'bar',
      },
    });

    await Resource.create({
      type: 'tasks',
      seed: true,
      data: {
        foo: 'bar',
      },
    });

    const { id: ephemeralResource1Id } = await Resource.create({
      type: 'tasks',
      ephemeral: true,
      data: {
        foo: 'bar',
      },
    });

    const { id: ephemeralResource2Id } = await Resource.create({
      type: 'tasks',
      ephemeral: true,
      data: {
        foo: 'bar',
      },
    });

    const { id: seedAssetId } = await Asset.create({
      name: 'tasks',
      seed: true,
    });
    await uploadS3File(`app-${appId}`, seedAssetId, createFixtureStream('standing.png'));

    const { id: ephemeralAssetId } = await Asset.create({
      name: 'tasks',
      ephemeral: true,
    });
    await uploadS3File(`app-${appId}`, ephemeralAssetId, createFixtureStream('standing.png'));

    await AppMember.create({
      email: user.primaryEmail,
      UserId: user.id,
      role: 'test',
      properties: {
        completedTasks: [ephemeralResource1Id, ephemeralResource2Id],
        lastCompletedTask: ephemeralResource1Id,
      },
      timezone: 'Europe/Amsterdam',
    });

    const appMember = (await AppMember.findOne({
      attributes: ['properties'],
    }))!;

    expect(appMember.dataValues).toMatchInlineSnapshot(`
      {
        "properties": {
          "completedTasks": [
            3,
            4,
          ],
          "lastCompletedTask": 3,
        },
      }
    `);

    await request.post(`/api/apps/${appId}/reseed`);

    const updatedAppMember = await AppMember.findOne({
      attributes: ['properties'],
    });

    expect(updatedAppMember).toMatchInlineSnapshot(`
      {
        "properties": {
          "completedTasks": [],
          "lastCompletedTask": 0,
        },
      }
    `);

    const seedResources = await Resource.findAll({
      where: {
        seed: true,
      },
    });

    expect(seedResources).toStrictEqual([
      expect.objectContaining({
        id: 1,
        data: { foo: 'bar' },
      }),
      expect.objectContaining({
        id: 2,
        data: { foo: 'bar' },
      }),
    ]);

    const oldEphemeralResource1 = await Resource.findOne({
      where: {
        id: ephemeralResource1Id,
      },
    });

    const oldEphemeralResource2 = await Resource.findOne({
      where: {
        id: ephemeralResource2Id,
      },
    });

    expect(oldEphemeralResource1).toBeNull();
    expect(oldEphemeralResource2).toBeNull();

    const newEphemeralResources = await Resource.findAll({
      where: {
        ephemeral: true,
      },
    });

    expect(newEphemeralResources).toStrictEqual([
      expect.objectContaining({
        id: 5,
        data: { foo: 'bar' },
        ephemeral: true,
      }),
      expect.objectContaining({
        id: 6,
        data: { foo: 'bar' },
        ephemeral: true,
      }),
    ]);

    const seedAsset = await Asset.findOne({
      attributes: ['name', 'seed', 'ephemeral'],
      where: {
        id: seedAssetId,
        seed: true,
      },
    });

    expect(seedAsset).toStrictEqual(
      expect.objectContaining({
        name: 'tasks',
        seed: true,
        ephemeral: false,
      }),
    );
    expect(await getS3FileBuffer(`app-${appId}`, seedAssetId)).toStrictEqual(
      await readFixture('standing.png'),
    );

    const oldEphemeralAsset = await Asset.findOne({
      where: {
        id: ephemeralAssetId,
      },
    });

    expect(oldEphemeralAsset).toBeNull();
    expect(await getS3FileBuffer(`app-${appId}`, ephemeralAssetId)).toBeNull();

    const newEphemeralAsset = (await Asset.findOne({
      attributes: ['id', 'name', 'seed', 'ephemeral'],
      where: {
        ephemeral: true,
      },
    }))!;

    expect(newEphemeralAsset).toStrictEqual(
      expect.objectContaining({
        name: 'tasks',
        seed: false,
        ephemeral: true,
      }),
    );
    expect(await getS3FileBuffer(`app-${appId}`, newEphemeralAsset.id)).toStrictEqual(
      await readFixture('standing.png'),
    );
  });

  it('should reseed resources that reference each other', async () => {
    authorizeStudio();
    const { id: appId } = await App.create({
      demoMode: true,
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        resources: {
          survey: {
            schema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                },
              },
            },
          },
          answer: {
            schema: {
              type: 'object',
              properties: {
                surveyId: {
                  type: 'integer',
                },
                content: {
                  type: 'string',
                },
              },
            },
            references: {
              surveyId: {
                resource: 'survey',
                delete: {
                  triggers: [
                    {
                      type: 'delete',
                      cascade: 'delete',
                    },
                  ],
                },
              },
            },
          },
        },
      },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const { Resource } = await getAppDB(1);
    await Resource.create({
      type: 'survey',
      seed: true,
      data: {
        title: 'Survey 1',
      },
    });

    await Resource.create({
      type: 'survey',
      seed: true,
      data: {
        title: 'Survey 2',
      },
    });

    await Resource.create({
      type: 'answer',
      seed: true,
      data: {
        $survey: 0,
        content: 'Answer 1',
      },
    });

    await Resource.create({
      type: 'answer',
      seed: true,
      data: {
        $survey: 1,
        content: 'Answer 2',
      },
    });

    const { id: ephemeralSurvey1Id } = await Resource.create({
      type: 'survey',
      ephemeral: true,
      data: {
        title: 'Survey 1',
      },
    });

    const { id: ephemeralSurvey2Id } = await Resource.create({
      type: 'tasks',
      ephemeral: true,
      data: {
        title: 'Survey 2',
      },
    });

    const { id: ephemeralAnswer1Id } = await Resource.create({
      type: 'survey',
      ephemeral: true,
      data: {
        $survey: 0,
        content: 'Answer 1',
      },
    });

    const { id: ephemeralAnswer2Id } = await Resource.create({
      type: 'tasks',
      ephemeral: true,
      data: {
        $survey: 1,
        content: 'Answer 2',
      },
    });

    await request.post(`/api/apps/${appId}/reseed`);

    const seedResources = await Resource.findAll({
      where: {
        seed: true,
      },
    });

    expect(seedResources).toMatchInlineSnapshot(`
      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "id": 1,
          "title": "Survey 1",
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "id": 2,
          "title": "Survey 2",
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$survey": 0,
          "$updated": "1970-01-01T00:00:00.000Z",
          "content": "Answer 1",
          "id": 3,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$survey": 1,
          "$updated": "1970-01-01T00:00:00.000Z",
          "content": "Answer 2",
          "id": 4,
        },
      ]
    `);

    const oldEphemeralSurvey1 = await Resource.findOne({
      where: {
        id: ephemeralSurvey1Id,
      },
    });

    const oldEphemeralSurvey2 = await Resource.findOne({
      where: {
        id: ephemeralSurvey2Id,
      },
    });

    const oldEphemeralAnswer1 = await Resource.findOne({
      where: {
        id: ephemeralAnswer1Id,
      },
    });

    const oldEphemeralAnswer2 = await Resource.findOne({
      where: {
        id: ephemeralAnswer2Id,
      },
    });

    expect(oldEphemeralSurvey1).toBeNull();
    expect(oldEphemeralSurvey2).toBeNull();
    expect(oldEphemeralAnswer1).toBeNull();
    expect(oldEphemeralAnswer2).toBeNull();

    const newEphemeralResources = await Resource.findAll({
      where: {
        ephemeral: true,
      },
    });

    expect(newEphemeralResources).toMatchInlineSnapshot(`
      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$ephemeral": true,
          "$updated": "1970-01-01T00:00:00.000Z",
          "id": 9,
          "title": "Survey 1",
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$ephemeral": true,
          "$updated": "1970-01-01T00:00:00.000Z",
          "id": 10,
          "title": "Survey 2",
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$ephemeral": true,
          "$survey": 0,
          "$updated": "1970-01-01T00:00:00.000Z",
          "content": "Answer 1",
          "id": 11,
          "surveyId": 9,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$ephemeral": true,
          "$survey": 1,
          "$updated": "1970-01-01T00:00:00.000Z",
          "content": "Answer 2",
          "id": 12,
          "surveyId": 10,
        },
      ]
    `);
  });
});
