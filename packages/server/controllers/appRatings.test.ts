import { createServer } from '@appsemble/node-utils/createServer.js';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';

import { App, AppRating, Member, Organization, User } from '../models/index.js';
import { appRouter } from '../routes/appRouter/index.js';
import { argv, setArgv } from '../utils/argv.js';
import { authorizeStudio, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';
import * as controllers from './index.js';

let app: App;
let user: User;

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer({
    argv,
    appRouter,
    controllers,
  });
  await setTestApp(server);
});

beforeEach(async () => {
  import.meta.jest.useFakeTimers({ now: 0 });
  user = await createTestUser();
  const organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  app = await App.create({
    OrganizationId: organization.id,
    vapidPublicKey: '',
    vapidPrivateKey: '',
    definition: {
      security: {
        default: {
          role: 'Test',
          policy: 'everyone',
        },
        roles: { Test: {} },
      },
    },
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
});

describe('submitAppRating', () => {
  it('should be possible to submit a new app rating', async () => {
    authorizeStudio(user);
    const response = await request.post(`/api/apps/${app.id}/ratings`, {
      description: 'Test description',
      rating: 5,
    });

    expect(response).toMatchInlineSnapshot(
      {
        data: { UserId: expect.stringMatching(uuid4Pattern) },
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "UserId": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "description": "Test description",
        "name": "Test User",
        "rating": 5,
      }
    `,
    );
  });

  it('should replace existing ratings', async () => {
    authorizeStudio(user);
    await request.post(`/api/apps/${app.id}/ratings`, {
      description: 'Test description',
      rating: 5,
    });

    import.meta.jest.advanceTimersByTime(20e3);

    const response = await request.post(`/api/apps/${app.id}/ratings`, {
      description: 'Updated description',
      rating: 3,
    });
    const ratings = await AppRating.findAll();

    expect(ratings).toHaveLength(1);
    expect(response).toMatchInlineSnapshot(
      {
        data: { UserId: expect.stringMatching(uuid4Pattern) },
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:20.000Z",
        "UserId": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "description": "Updated description",
        "name": "Test User",
        "rating": 3,
      }
    `,
    );
  });
});

describe('getAppRatings', () => {
  it('should return an empty array', async () => {
    const response = await request.get(`/api/apps/${app.id}/ratings`);

    expect(response.data).toStrictEqual([]);
  });

  it('should list all app ratings', async () => {
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    await AppRating.create({
      AppId: app.id,
      UserId: user.id,
      rating: 5,
      description: 'This is a test rating',
    });
    await AppRating.create({
      AppId: app.id,
      UserId: userB.id,
      rating: 4,
      description: 'This is also a test rating',
    });

    const response = await request.get(`/api/apps/${app.id}/ratings`);

    expect(response).toMatchInlineSnapshot(
      {
        data: [
          {
            UserId: expect.stringMatching(uuid4Pattern),
          },

          {
            UserId: expect.stringMatching(uuid4Pattern),
          },
        ],
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "UserId": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "description": "This is a test rating",
          "name": "Test User",
          "rating": 5,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "UserId": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "description": "This is also a test rating",
          "name": null,
          "rating": 4,
        },
      ]
    `,
    );
  });
});
