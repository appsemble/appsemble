import { type BlockManifest, PredefinedOrganizationRole } from '@appsemble/types';
import { setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createBlockVersionResponse,
  type ExtendedBlockVersion,
} from './createBlockVersionResponse.js';
import { BlockVersion } from '../models/BlockVersion.js';
import { Organization } from '../models/Organization.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { type User } from '../models/User.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../utils/test/authorization.js';

let user: User;
let organization: Organization;
let member: OrganizationMember;
let server: any;

function blockVersionMapper(
  blockVersion: ExtendedBlockVersion,
): Omit<BlockManifest, 'files' | 'languages'> {
  const { OrganizationId, examples, name, version, visibility, wildcardActions } = blockVersion;
  return {
    name: `@${OrganizationId}/${name}`,
    version,
    examples,
    wildcardActions,
    visibility,
  };
}

describe('Create block version response', () => {
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
    });
    member = await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should show unlisted organization blocks when user is part of organization', async () => {
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.Member },
      { where: { UserId: user.id } },
    );
    const blockVersion = await BlockVersion.create({
      OrganizationId: organization.id,
      name: 'test',
      version: '0.0.0',
      wildcardActions: false,
      visibility: 'unlisted',
    });
    authorizeStudio();
    const response = await createBlockVersionResponse(
      { user } as any,
      [blockVersion],
      blockVersionMapper,
    );
    expect(response).toMatchInlineSnapshot(`
      [
        {
          "examples": [],
          "name": "@testorganization/test",
          "version": "0.0.0",
          "visibility": "unlisted",
          "wildcardActions": false,
        },
      ]
    `);
  });

  it('should continue to create block version response when user is deleted', async () => {
    const blockVersion = await BlockVersion.create({
      OrganizationId: organization.id,
      name: 'test',
      version: '0.0.0',
      wildcardActions: false,
      visibility: 'public',
    });
    await user.destroy();
    const response = await createBlockVersionResponse(
      { user } as any,
      [blockVersion],
      blockVersionMapper,
    );
    expect(response).toMatchInlineSnapshot(`
      [
        {
          "examples": [],
          "name": "@testorganization/test",
          "version": "0.0.0",
          "visibility": "public",
          "wildcardActions": false,
        },
      ]
    `);
  });

  it('should continue to create block version response when user is null or undefined', async () => {
    const blockVersion = await BlockVersion.create({
      OrganizationId: organization.id,
      name: 'test',
      version: '0.0.0',
      wildcardActions: false,
      visibility: 'public',
    });
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    user = null;
    const response = await createBlockVersionResponse(
      { user } as any,
      [blockVersion],
      blockVersionMapper,
    );
    expect(response).toMatchInlineSnapshot(`
      [
        {
          "examples": [],
          "name": "@testorganization/test",
          "version": "0.0.0",
          "visibility": "public",
          "wildcardActions": false,
        },
      ]
    `);
  });

  it('should not return unlisted blocks when user is not part of the organization', async () => {
    const blockVersionUnlisted = await BlockVersion.create({
      OrganizationId: organization.id,
      name: 'test',
      version: '0.0.0',
      wildcardActions: false,
      visibility: 'unlisted',
    });
    const blockVersionPublic = await BlockVersion.create({
      OrganizationId: organization.id,
      name: 'test1',
      version: '0.0.0',
      wildcardActions: false,
      visibility: 'public',
    });
    member.destroy();
    const response = await createBlockVersionResponse(
      { user } as any,
      [blockVersionUnlisted, blockVersionPublic],
      blockVersionMapper,
    );
    expect(response).toMatchInlineSnapshot(`
      [
        {
          "examples": [],
          "name": "@testorganization/test1",
          "version": "0.0.0",
          "visibility": "public",
          "wildcardActions": false,
        },
      ]
    `);
  });
});
