import { PredefinedOrganizationRole } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppRating,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let app: App;
let user: User;

describe('createAppRating', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
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
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

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

    vi.useRealTimers();
    vi.useFakeTimers();
    vi.setSystemTime(0);
    vi.advanceTimersByTime(20e3);

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
