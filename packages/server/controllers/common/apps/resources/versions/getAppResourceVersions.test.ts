import { PredefinedAppRole } from '@appsemble/lang-sdk';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppMember,
  Organization,
  OrganizationMember,
  Resource,
  ResourceVersion,
  type User,
} from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

let user: User;

describe('getAppResourceVersions', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    user = await createTestUser();
    await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      UserId: user.id,
      OrganizationId: 'testorganization',
      role: PredefinedOrganizationRole.AppContentsExplorer,
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
    vi.useRealTimers();
  });

  it('should return 404 if no app was found', async () => {
    const response = await request.get('/api/apps/789/resources/any/1/versions');

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
    const response = await request.get('/api/apps/1/resources/nonexistent/1/versions');

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
    const response = await request.get('/api/apps/1/resources/noHistory/1/versions');

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
    const response = await request.get('/api/apps/1/resources/yesHistory/1/versions');

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
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2000-01-01T00:00:00Z'));
    const resource = await Resource.create({
      AppId: 1,
      type: 'yesHistory',
      data: { version: 'old' },
    });
    const member = await AppMember.create({
      email: user.primaryEmail,
      AppId: 1,
      UserId: user.id,
      name: user.name,
      role: PredefinedAppRole.Member,
    });
    vi.advanceTimersByTime(1000);
    await ResourceVersion.create({
      AppMemberId: member.id,
      ResourceId: resource.id,
      data: { version: 'new' },
    });
    vi.advanceTimersByTime(1000);
    await ResourceVersion.create({ ResourceId: resource.id, data: { version: 'newer' } });
    vi.advanceTimersByTime(1000);
    await resource.update({ EditorId: member.id, data: { version: 'newest' } });

    const response = await request.get(`/api/apps/1/resources/yesHistory/${resource.id}/versions`);

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
            "email": "test@example.com",
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
            "email": "test@example.com",
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
