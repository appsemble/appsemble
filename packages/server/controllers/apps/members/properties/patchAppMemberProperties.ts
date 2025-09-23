import { AppPermission } from '@appsemble/lang-sdk';
import {
  AppMemberPropertiesError,
  assertKoaCondition,
  logger,
  throwKoaError,
} from '@appsemble/node-utils';
import { type Context } from 'koa';

<<<<<<<< HEAD:packages/server/controllers/apps/members/properties/patchAppMemberProperties.ts
import { AppMember } from '../../../../models/index.js';
========
import { App, getAppDB } from '../../../../models/index.js';
>>>>>>>> 421054bb29 (support database per app):packages/server/controllers/common/apps/members/patchAppMemberProperties.ts
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
      logger.error(error);
      throwKoaError(ctx, 400, error.message);
    }
    throw error;
  }
}
