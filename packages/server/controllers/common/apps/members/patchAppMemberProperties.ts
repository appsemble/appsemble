import { AppMemberPropertiesError, assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
import { getAppMemberInfo, parseAppMemberProperties } from '../../../../utils/appMember.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function patchAppMemberProperties(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appMemberId },
    queryParams: { selectedGroupId },
    request: {
      body: { properties },
    },
    user: authSubject,
  } = ctx;
  const app = await App.findByPk(appId);
  assertKoaCondition(app != null, ctx, 404, 'App not found.');

  const { AppMember } = await getAppDB(appId);
  const appMember = await AppMember.findByPk(appMemberId, {
    attributes: {
      exclude: ['password'],
    },
  });

  assertKoaCondition(appMember != null, ctx, 404, 'App member not found');

  assertKoaCondition(
    appMemberId !== authSubject!.id,
    ctx,
    401,
    'Cannot use this endpoint to patch your own properties',
  );

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId,
    requiredPermissions: [AppPermission.PatchAppMemberProperties],
    groupId: selectedGroupId,
  });

  try {
    const updatedAppMember = await appMember.update({
      properties: { ...appMember.properties, ...parseAppMemberProperties(properties) },
    });

    ctx.body = getAppMemberInfo(appId, updatedAppMember);
  } catch (error: any) {
    if (error instanceof AppMemberPropertiesError) {
      throwKoaError(ctx, 400, error.message);
    }
    throw error;
  }
}
