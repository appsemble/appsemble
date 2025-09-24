import { AppPermission } from '@appsemble/lang-sdk';
import { AppMemberPropertiesError, assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { getAppDB } from '../../../../models/index.js';
import { getAppMemberInfo, parseAppMemberProperties } from '../../../../utils/appMember.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function updateAppMemberProperties(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appMemberId },
    queryParams: { selectedGroupId },
    request: {
      body: { properties },
    },
    user: authSubject,
  } = ctx;

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
      properties: parseAppMemberProperties(properties),
    });

    ctx.body = getAppMemberInfo(appId, updatedAppMember);
  } catch (error: any) {
    if (error instanceof AppMemberPropertiesError) {
      throwKoaError(ctx, 400, error.message);
    }
    throw error;
  }
}
