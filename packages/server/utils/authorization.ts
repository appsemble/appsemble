import { assertKoaError } from '@appsemble/node-utils';
import {
  type AppsPermission,
  type MainPermission,
  organizationMemberRoles,
} from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember, OrganizationMember, User } from '../models/index.js';

export async function checkAppMemberPermissions(
  ctx: Context,
  appId: string,
  permissions: AppsPermission[],
): Promise<void> {
  const { user: authSubject } = ctx;

  const appMember = await AppMember.findByPk(authSubject.id, { attributes: ['role'] });

  const app = await App.findByPk(appId);

  assertKoaError(!app, ctx, 404, 'App not found');

  const appMemberRole = app.definition.security?.roles[appMember.role];

  assertKoaError(
    !permissions.every((p) => appMemberRole.permissions.includes(p)),
    ctx,
    403,
    'App member does not have sufficient permissions.',
  );
}

export async function checkUserPermissions(
  ctx: Context,
  organizationId: string,
  permissions: MainPermission[],
): Promise<void> {
  const { user: authSubject } = ctx;

  const organizationMember = await OrganizationMember.findOne({
    where: {
      OrganizationId: organizationId,
      UserId: authSubject.id,
    },
  });

  assertKoaError(!organizationMember, ctx, 403, 'User is not part of this organization.');

  const organizationMemberRole = organizationMemberRoles[organizationMember.role];

  assertKoaError(
    !permissions.every((p) => organizationMemberRole.includes(p)),
    ctx,
    403,
    'User does not have sufficient permissions.',
  );
}
