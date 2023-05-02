import { createServer } from '@appsemble/node-utils/createServer.js';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';

import { App, Member, Organization, Resource, ResourceVersion, User } from '../models/index.js';
import { appRouter } from '../routes/appRouter/index.js';
import { argv, setArgv } from '../utils/argv.js';
import { authentication } from '../utils/authentication.js';
import { authorizeStudio, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';
import * as controllers from './index.js';

let user: User;

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer({
    argv,
    appRouter,
    controllers,
    authentication: authentication(),
  });
  await setTestApp(server);
});

beforeEach(async () => {
  user = await createTestUser();
  await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await Member.create({
    UserId: user.id,
    OrganizationId: 'testorganization',
    role: 'Maintainer',
  });
  await App.create({
    OrganizationId: 'testorganization',
    vapidPublicKey: '',
    vapidPrivateKey: '',
    definition: {
      name: 'Test App',
      resources: {
        noHistory: {},
        yesHistory: {
          history: true,
        },
      },
      pages: [],
    },
  });
  authorizeStudio(user);
});

afterEach(() => {
  import.meta.jest.useRealTimers();
});

describe('getResourceHistory', () => {
  it('should return 404 if no app was found', async () => {
    const response = await request.get('/api/apps/789/resources/any/1/history');

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

  it('should return 404 if no resource definition was found', async () => {
    const response = await request.get('/api/apps/1/resources/nonexistent/1/history');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App does not have resources called nonexistent",
        "statusCode": 404,
      }
    `);
  });

  it('should return 404 if the resource definition doesn’t support history', async () => {
    const response = await request.get('/api/apps/1/resources/noHistory/1/history');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource “noHistory” has no history",
        "statusCode": 404,
      }
    `);
  });

  it('should return 404 if no resource was found for the given ID was found', async () => {
    const response = await request.get('/api/apps/1/resources/yesHistory/1/history');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });

  it('should return the resource history if history is set to true', async () => {
    import.meta.jest.useFakeTimers();
    import.meta.jest.setSystemTime(new Date('2000-01-01T00:00:00Z'));
    const resource = await Resource.create({
      AppId: 1,
      type: 'yesHistory',
      data: { version: 'old' },
    });
    import.meta.jest.advanceTimersByTime(1000);
    await ResourceVersion.create({
      UserId: user.id,
      ResourceId: resource.id,
      data: { version: 'new' },
    });
    import.meta.jest.advanceTimersByTime(1000);
    await ResourceVersion.create({ ResourceId: resource.id, data: { version: 'newer' } });
    import.meta.jest.advanceTimersByTime(1000);
    await resource.update({ EditorId: user.id, data: { version: 'newest' } });

    const response = await request.get(`/api/apps/1/resources/yesHistory/${resource.id}/history`);

    expect(response).toMatchInlineSnapshot(
      {
        data: [
          { author: { id: expect.stringMatching(uuid4Pattern) } },
          {},
          { author: { id: expect.stringMatching(uuid4Pattern) } },
        ],
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "author": {
            "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
            "name": "Test User",
          },
          "created": "2000-01-01T00:00:03.000Z",
          "data": {
            "version": "newest",
          },
        },
        {
          "created": "2000-01-01T00:00:02.000Z",
          "data": {
            "version": "newer",
          },
        },
        {
          "author": {
            "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
            "name": "Test User",
          },
          "created": "2000-01-01T00:00:01.000Z",
          "data": {
            "version": "new",
          },
        },
      ]
    `,
    );
  });
});
