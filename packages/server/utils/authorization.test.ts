import { AppPermission, type AppRole } from '@appsemble/lang-sdk';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { setTestApp } from 'axios-test-instance';
import { type Context } from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { checkAppMemberAppPermissions } from './authorization.js';
import { setArgv } from './argv.js';
import { createServer } from './createServer.js';
import { createTestUser } from './test/authorization.js';
import {
  App,
  type AppMember,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../models/index.js';

let organization: Organization;
let user: User;
let app: App;

/**
 * Build a minimal Koa context stand-in for the permission helpers.
 *
 * The helpers only read `context.user` and hand the context to
 * `assertKoaCondition`, which on failure sets `response.status`/`response.body`
 * and then calls `context.throw()`. The stub turns that into a thrown error
 * carrying the status and message so tests can assert on the observable
 * permit/deny outcome.
 *
 * @param appMemberId The id of the authenticated app member.
 * @returns A context usable by the app permission helpers.
 */
function createAppMemberContext(appMemberId: string): Context {
  const context = {
    user: { id: appMemberId },
    response: {} as { status?: number; body?: { message?: string } },
    throw(): never {
      const error = new Error(context.response.body?.message ?? 'Koa error') as Error & {
        status?: number;
      };
      error.status = context.response.status;
      throw error;
    },
  };
  return context as unknown as Context;
}

async function createAppMemberWithRoles(email: string, roles: AppRole[]): Promise<AppMember> {
  const { AppMember } = await getAppDB(app.id);
  return AppMember.create({
    email,
    name: 'Test App Member',
    locale: 'en',
    timezone: 'Europe/Amsterdam',
    roles,
  });
}

describe('checkAppMemberAppPermissions', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });

    // `Alpha` grants only `$member:query`, `Beta` grants only `$group:query`, so
    // the two permissions are disjoint across the two roles.
    app = await App.create({
      definition: {
        name: 'Test App',
        security: {
          roles: {
            Alpha: {
              permissions: [AppPermission.QueryAppMembers],
            },
            Beta: {
              permissions: [AppPermission.QueryGroups],
            },
          },
          default: {
            role: 'Alpha',
          },
        },
      },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
  });

  it('grants a permission held by the first of the app member roles', async () => {
    const appMember = await createAppMemberWithRoles('multi@example.com', ['Alpha', 'Beta']);

    expect(
      await checkAppMemberAppPermissions({
        appId: app.id,
        context: createAppMemberContext(appMember.id),
        requiredPermissions: [AppPermission.QueryAppMembers],
      }),
    ).toBeUndefined();
  });

  it('grants a permission held only by a non-primary app member role', async () => {
    const appMember = await createAppMemberWithRoles('multi@example.com', ['Alpha', 'Beta']);

    // `Beta` is not the primary (first) role, so this only passes when the check
    // reads the full role set instead of the singular legacy role.
    expect(
      await checkAppMemberAppPermissions({
        appId: app.id,
        context: createAppMemberContext(appMember.id),
        requiredPermissions: [AppPermission.QueryGroups],
      }),
    ).toBeUndefined();
  });

  it('grants the union of permissions across all app member roles', async () => {
    const appMember = await createAppMemberWithRoles('multi@example.com', ['Alpha', 'Beta']);

    expect(
      await checkAppMemberAppPermissions({
        appId: app.id,
        context: createAppMemberContext(appMember.id),
        requiredPermissions: [AppPermission.QueryAppMembers, AppPermission.QueryGroups],
      }),
    ).toBeUndefined();
  });

  it('denies a permission that a single-role member does not hold', async () => {
    const appMember = await createAppMemberWithRoles('single@example.com', ['Alpha']);

    await expect(
      checkAppMemberAppPermissions({
        appId: app.id,
        context: createAppMemberContext(appMember.id),
        requiredPermissions: [AppPermission.QueryGroups],
      }),
    ).rejects.toThrow('App member does not have sufficient app permissions.');
  });

  it('denies a permission that none of the app member roles hold', async () => {
    const appMember = await createAppMemberWithRoles('multi@example.com', ['Alpha', 'Beta']);

    await expect(
      checkAppMemberAppPermissions({
        appId: app.id,
        context: createAppMemberContext(appMember.id),
        requiredPermissions: [AppPermission.DeleteAppMembers],
      }),
    ).rejects.toThrow('App member does not have sufficient app permissions.');
  });
});
