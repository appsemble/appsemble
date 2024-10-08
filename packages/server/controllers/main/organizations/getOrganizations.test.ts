import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { createTestUser } from '../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../utils/test/testSchema.js';

let organization: Organization;
let server: Koa;
let user: User;

useTestDatabase(import.meta);

beforeAll(async () => {
  vi.useFakeTimers();
  setArgv({ host: 'http://localhost', secret: 'test' });
  server = await createServer();
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
    icon: await readFixture('nodejs-logo.png'),
  });
  await OrganizationMember.create({
    OrganizationId: organization.id,
    UserId: user.id,
    role: PredefinedOrganizationRole.Owner,
  });
  await Organization.create({
    id: 'appsemble',
    name: 'Appsemble',
  });
});

afterAll(() => {
  vi.useRealTimers();
});

describe('getOrganizations', () => {
  it('should fetch all organizations with public apps or public blocks', async () => {
    await Organization.create({
      id: 'random',
      name: 'Random Organization',
    });
    await Organization.create({
      id: 'blocker',
      name: 'Organization with Blocks',
    });
    await Organization.create({
      id: 'private',
      name: 'Private organization with private apps and blocks',
    });
    await App.create({
      vapidPublicKey: '',
      vapidPrivateKey: '',
      OrganizationId: 'appsemble',
      visibility: 'public',
      definition: {
        defaultPage: '',
        resources: { testResource: { schema: { type: 'object' } } },
        pages: [
          {
            name: '',
            blocks: [],
          },
        ],
      },
    });
    await App.create({
      vapidPublicKey: '',
      vapidPrivateKey: '',
      OrganizationId: 'testorganization',
      visibility: 'public',
      definition: {
        defaultPage: '',
        resources: { testResource: { schema: { type: 'object' } } },
        pages: [
          {
            name: '',
            blocks: [],
          },
        ],
      },
    });
    await App.create({
      vapidPublicKey: '',
      vapidPrivateKey: '',
      OrganizationId: 'private',
      visibility: 'unlisted',
      definition: {
        defaultPage: '',
        resources: { testResource: { schema: { type: 'object' } } },
        pages: [
          {
            name: '',
            blocks: [],
          },
        ],
      },
    });
    await BlockVersion.create({
      name: 'test',
      version: '0.0.0',
      OrganizationId: 'blocker',
      parameters: {
        properties: {
          type: 'object',
          foo: {
            type: 'number',
          },
        },
      },
    });
    await BlockVersion.create({
      name: 'test',
      version: '0.0.0',
      OrganizationId: 'private',
      visibility: 'unlisted',
      parameters: {
        properties: {
          type: 'object',
          foo: {
            type: 'number',
          },
        },
      },
    });

    const response = await request.get('/api/organizations');

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: 'appsemble',
          name: 'Appsemble',
        },
        {
          id: 'blocker',
          name: 'Organization with Blocks',
        },
        {
          id: 'testorganization',
          name: 'Test Organization',
          iconUrl: '/api/organizations/testorganization/icon?updated=1970-01-01T00:00:00.000Z',
        },
      ],
    });
  });
});
