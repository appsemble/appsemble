import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Organization, OrganizationMember, type User } from '../../../models/index.js';
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
});

describe('getOrganizationIcon', () => {
  it('should return the organization logo squared by default', async () => {
    const icon = await readFixture('tux.png');
    await organization.update({ icon });
    const response = await request.get(`/api/organizations/${organization.id}/icon`, {
      responseType: 'arraybuffer',
    });

    expect(response.data).toMatchImageSnapshot();
  });

  it('should set a background color if specified', async () => {
    const icon = await readFixture('tux.png');
    await organization.update({ icon });
    const response = await request.get(`/api/organizations/${organization.id}/icon`, {
      responseType: 'arraybuffer',
      params: { background: '#ffff00' },
    });

    expect(response.data).toMatchImageSnapshot();
  });

  it('should scale the icon is maskable is true', async () => {
    const icon = await readFixture('tux.png');
    await organization.update({ icon });
    const response = await request.get(`/api/organizations/${organization.id}/icon`, {
      responseType: 'arraybuffer',
      params: { maskable: true },
    });

    expect(response.data).toMatchImageSnapshot();
  });

  it('should be able to resize images', async () => {
    const icon = await readFixture('tux.png');
    await organization.update({ icon });
    const response = await request.get(`/api/organizations/${organization.id}/icon`, {
      responseType: 'arraybuffer',
      params: { size: 96 },
    });

    expect(response.data).toMatchImageSnapshot();
  });

  it('should be able to combine maskable, background, and size', async () => {
    const icon = await readFixture('tux.png');
    await organization.update({ icon });
    const response = await request.get(`/api/organizations/${organization.id}/icon`, {
      responseType: 'arraybuffer',
      params: { background: '#00ffff', maskable: true, size: 192 },
    });

    expect(response.data).toMatchImageSnapshot();
  });

  it('should be possible retrieve the raw icon', async () => {
    const icon = await readFixture('tux.png');
    await organization.update({ icon });
    const response = await request.get(`/api/organizations/${organization.id}/icon`, {
      responseType: 'arraybuffer',
      params: { raw: true },
    });

    expect(response.data).toStrictEqual(icon);
  });

  it('should have a fallback icon', async () => {
    await organization.update({ icon: null });
    const response = await request.get(`/api/organizations/${organization.id}/icon`, {
      responseType: 'arraybuffer',
      params: { raw: true },
    });

    expect(response.data).toMatchImageSnapshot();
  });
});
