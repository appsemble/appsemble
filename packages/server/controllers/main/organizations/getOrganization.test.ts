import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

let organization: Organization;
let server: Koa;
let user: User;

describe('getOrganization', () => {
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

  it('should fetch an organization if the user is logged in', async () => {
    authorizeStudio();

    const response = await request.get('/api/organizations/testorganization');

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: 'testorganization',
        name: 'Test Organization',
        iconUrl: '/api/organizations/testorganization/icon?updated=1970-01-01T00:00:00.000Z',
      },
    });
  });

  it('should fetch an organization for anonymous users with public apps', async () => {
    await App.create({
      path: 'test-app-public',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'testorganization',
      visibility: 'public',
    });

    const response = await request.get('/api/organizations/testorganization');

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: 'testorganization',
        name: 'Test Organization',
        iconUrl: '/api/organizations/testorganization/icon?updated=1970-01-01T00:00:00.000Z',
      },
    });
  });

  it('should fetch an organization for anonymous users with public blocks', async () => {
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

    const response = await request.get('/api/organizations/testorganization');

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: 'testorganization',
        name: 'Test Organization',
        iconUrl: '/api/organizations/testorganization/icon?updated=1970-01-01T00:00:00.000Z',
      },
    });
  });

  it('should not fetch an organization without public apps or public blocks if the user is not logged in', async () => {
    const response = await request.get('/api/organizations/testorganization');

    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', statusCode: 404, message: 'Organization not found.' },
    });
  });

  it('should not fetch a non-existent organization', async () => {
    authorizeStudio();
    const response = await request.get('/api/organizations/foo');

    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', statusCode: 404, message: 'Organization not found.' },
    });
  });
});
