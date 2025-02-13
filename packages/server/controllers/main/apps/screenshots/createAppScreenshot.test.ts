import { createFixtureStream, createFormData } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppScreenshot,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let organization: Organization;
let user: User;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('createAppScreenshot', () => {
  beforeAll(async () => {
    setArgv(argv);
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
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

  it('should create one screenshot', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const form = createFormData({
      screenshots: createFixtureStream('standing.png'),
    });

    authorizeStudio();
    const createdResponse = await request.post(`/api/apps/${app.id}/screenshots`, form);

    expect(createdResponse).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      [
        1,
      ]
    `);
  });

  it('should create multiple screenshots', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const form = createFormData({
      screenshots: [createFixtureStream('standing.png'), createFixtureStream('standing.png')],
    });

    authorizeStudio();
    const createdResponse = await request.post(`/api/apps/${app.id}/screenshots`, form);

    expect(createdResponse).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      [
        1,
        2,
      ]
    `);
  });

  it('should create multiple screenshots by language and order them', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });

    const form = createFormData({
      screenshots: [createFixtureStream('standing.png'), createFixtureStream('standing.png')],
    });

    authorizeStudio();

    await request.post(`/api/apps/${app.id}/screenshots`, form);

    const createdUnspecifiedScreenshots1 = await AppScreenshot.findAll({
      where: {
        AppId: app.id,
        language: 'unspecified',
      },
    });

    expect(createdUnspecifiedScreenshots1[0].toJSON()).toStrictEqual({
      AppId: 1,
      created: expect.any(Date),
      height: 247,
      id: 1,
      index: 0,
      language: 'unspecified',
      mime: 'image/png',
      screenshot: expect.any(Buffer),
      updated: expect.any(Date),
      width: 474,
    });

    expect(createdUnspecifiedScreenshots1[1].toJSON()).toStrictEqual({
      AppId: 1,
      created: expect.any(Date),
      height: 247,
      id: 2,
      index: 1,
      language: 'unspecified',
      mime: 'image/png',
      screenshot: expect.any(Buffer),
      updated: expect.any(Date),
      width: 474,
    });

    const formNl = createFormData({
      screenshots: [createFixtureStream('standing.png'), createFixtureStream('standing.png')],
      language: 'nl',
    });

    await request.post(`/api/apps/${app.id}/screenshots`, formNl);

    const createdUnspecifiedScreenshots2 = await AppScreenshot.findAll({
      where: {
        AppId: app.id,
        language: 'unspecified',
      },
      order: [['index', 'ASC']],
    });

    expect(createdUnspecifiedScreenshots2[2].toJSON()).toStrictEqual({
      AppId: 1,
      created: expect.any(Date),
      height: 247,
      id: 3,
      index: 2,
      language: 'unspecified',
      mime: 'image/png',
      screenshot: expect.any(Buffer),
      updated: expect.any(Date),
      width: 474,
    });

    expect(createdUnspecifiedScreenshots2[3].toJSON()).toStrictEqual({
      AppId: 1,
      created: expect.any(Date),
      height: 247,
      id: 4,
      index: 3,
      language: 'unspecified',
      mime: 'image/png',
      screenshot: expect.any(Buffer),
      updated: expect.any(Date),
      width: 474,
    });

    await AppScreenshot.create({
      screenshot: Buffer.from(''),
      AppId: app.id,
      index: 0,
      language: 'nl',
      mime: 'image/png',
      width: 100,
      height: 200,
    });

    const formNl2 = createFormData({
      screenshots: [createFixtureStream('standing.png'), createFixtureStream('standing.png')],
      language: 'nl',
    });

    await request.post(`/api/apps/${app.id}/screenshots`, formNl2);

    const createdNlScreenshots = await AppScreenshot.findAll({
      where: {
        AppId: app.id,
        language: 'nl',
      },
    });

    expect(createdNlScreenshots[1].toJSON()).toStrictEqual({
      AppId: 1,
      created: expect.any(Date),
      height: 247,
      id: 6,
      index: 1,
      language: 'nl',
      mime: 'image/png',
      screenshot: expect.any(Buffer),
      updated: expect.any(Date),
      width: 474,
    });

    expect(createdNlScreenshots[2].toJSON()).toStrictEqual({
      AppId: 1,
      created: expect.any(Date),
      height: 247,
      id: 7,
      index: 2,
      language: 'nl',
      mime: 'image/png',
      screenshot: expect.any(Buffer),
      updated: expect.any(Date),
      width: 474,
    });
  });

  // XXX: Re-enable this test when updating Koas 🧀
  // eslint-disable-next-line vitest/no-disabled-tests
  it.skip('should not accept empty arrays of screenshots', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const form = createFormData({});

    authorizeStudio();
    const createdResponse = await request.post(`/api/apps/${app.id}/screenshots`, form);

    expect(createdResponse).toMatchInlineSnapshot();
  });

  it('should not accept files that aren’t images', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const form = createFormData({ screenshots: Buffer.from('I am not a screenshot') });

    authorizeStudio();
    const createdResponse = await request.post(`/api/apps/${app.id}/screenshots`, form);

    expect(createdResponse).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "errors": [
          {
            "argument": "image/png,image/jpeg,image/tiff,image/webp",
            "instance": {
              "screenshots": [
                "",
              ],
            },
            "message": "has an invalid content type",
            "name": "contentType",
            "path": [
              "screenshots",
              0,
            ],
            "property": "instance.screenshots[0]",
            "schema": {},
            "stack": "instance has an invalid content type",
          },
        ],
        "message": "Invalid content types found",
      }
    `);
  });
});
