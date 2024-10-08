import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../utils/test/testSchema.js';

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
});

describe('getOrganizationBlocks', () => {
  it('should return the organization’s public blocks', async () => {
    await BlockVersion.create({
      name: 'test',
      version: '0.0.0',
      OrganizationId: 'testorganization',
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
      name: 'test-2',
      version: '0.0.0',
      OrganizationId: 'testorganization',
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

    const response = await request.get('/api/organizations/testorganization/blocks');

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          actions: null,
          description: null,
          events: null,
          iconUrl: '/api/organizations/testorganization/icon?updated=1970-01-01T00:00:00.000Z',
          layout: null,
          longDescription: null,
          name: '@testorganization/test',
          parameters: {
            properties: {
              foo: {
                type: 'number',
              },
              type: 'object',
            },
          },
          version: '0.0.0',
        },
      ],
    });
  });

  it('should include the organization’s private blocks if the user is logged in', async () => {
    authorizeStudio(user);
    await BlockVersion.create({
      name: 'test',
      version: '0.0.0',
      OrganizationId: 'testorganization',
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
      name: 'test-2',
      version: '0.0.0',
      OrganizationId: 'testorganization',
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

    const response = await request.get('/api/organizations/testorganization/blocks');

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          actions: null,
          description: null,
          events: null,
          iconUrl: '/api/organizations/testorganization/icon?updated=1970-01-01T00:00:00.000Z',
          layout: null,
          longDescription: null,
          name: '@testorganization/test',
          parameters: {
            properties: {
              foo: {
                type: 'number',
              },
              type: 'object',
            },
          },
          version: '0.0.0',
        },
        {
          actions: null,
          description: null,
          events: null,
          iconUrl: '/api/organizations/testorganization/icon?updated=1970-01-01T00:00:00.000Z',
          layout: null,
          longDescription: null,
          name: '@testorganization/test-2',
          parameters: {
            properties: {
              foo: {
                type: 'number',
              },
              type: 'object',
            },
          },
          version: '0.0.0',
        },
      ],
    });
  });
});
