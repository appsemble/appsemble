import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { AppMember } from '../../../models/index.js';
import { getAppMemberInfo, parseAppMemberProperties } from '../../../utils/appMember.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function patchAppMemberProperties(ctx: Context): Promise<void> {
  const {
    pathParams: { appMemberId },
    request: {
      body: { properties },
    },
  } = ctx;

  const appMember = await AppMember.findByPk(appMemberId, {
    attributes: {
      exclude: ['password'],
    },
  });

  assertKoaError(!appMember, ctx, 404, 'App member not found');

  await checkAuthSubjectAppPermissions(ctx, appMember.AppId, [
    AppPermission.PatchAppMemberProperties,
  ]);

  const updatedAppMember = await appMember.update({
    properties: parseAppMemberProperties(properties),
  });

  ctx.body = getAppMemberInfo(updatedAppMember);
}
