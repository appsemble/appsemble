import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AppCollection,
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

describe('deleteOrganization', () => {
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

  it('should delete the organization if user is the owner', async () => {
    const organization2 = await Organization.create({
      id: 'testorganization2',
      name: 'Test Organization',
    });
    authorizeStudio();
    await OrganizationMember.create({
      OrganizationId: organization2.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    await request.delete(`/api/organizations/${organization2.id}`);
    const response = await request.get(`/api/organizations/${organization2.id}`);
    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', statusCode: 404, message: 'Organization not found.' },
    });
  });

  it('should not delete an organization, user is not owner', async () => {
    await OrganizationMember.update(
      { role: 'Member' },
      { where: { OrganizationId: organization.id, UserId: user.id } },
    );
    authorizeStudio();
    const response = await request.delete(`/api/organizations/${organization.id}`);
    expect(response).toMatchObject({
      data: { message: 'User does not have sufficient organization permissions.' },
      status: 403,
    });

    const organizationId = (await Organization.findByPk(organization.id))!;
    expect(organizationId.id).toBe(organization.id);
  });

  it('should not delete the organization with associated blocks', async () => {
    const organization2 = await Organization.create({
      id: 'testorganization2',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization2.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    await BlockVersion.create({
      name: 'test',
      version: '0.0.0',
      OrganizationId: organization2.id,
      parameters: {
        properties: {
          type: 'object',
          foo: {
            type: 'number',
          },
        },
      },
    });
    authorizeStudio();
    const response = await request.delete(`/api/organizations/${organization2.id}`);
    expect(response).toMatchObject({
      status: 403,
      data: { message: 'Cannot delete an organization with associated blocks.' },
    });
    const organizationId = (await Organization.findByPk(organization.id))!;
    expect(organizationId.id).toBe(organization.id);
  });

  it('should not delete the organization with associated app collections', async () => {
    const organization2 = await Organization.create({
      id: 'testorganization2',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization2.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    await AppCollection.create({
      name: 'Collection',
      expertName: 'Expert van den Expert',
      expertProfileImage: Buffer.from(''),
      headerImage: Buffer.from(''),
      expertProfileImageMimeType: 'image/png',
      headerImageMimeType: 'image/png',
      expertDescription: 'I’m an expert, trust me.',
      OrganizationId: organization2.id,
      visibility: 'public',
    });
    authorizeStudio();
    const response = await request.delete(`/api/organizations/${organization2.id}`);
    expect(response).toMatchObject({
      status: 403,
      data: { message: 'Cannot delete an organization with associated app collections.' },
    });
    const organizationId = (await Organization.findByPk(organization.id))!;
    expect(organizationId.id).toBe(organization.id);
  });
});
