import { assertKoaError } from '@appsemble/node-utils';
import { type AppMemberInfo } from '@appsemble/types';
import { AppPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { AppMember } from '../../../../models/index.js';
import { getAppMemberInfo, parseAppMemberProperties } from '../../../../utils/appMember.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function patchAppMemberById(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId },
    request: {
      body: { properties, role },
    },
  } = ctx;

  await checkAuthSubjectAppPermissions(ctx, appId, [AppPermission.PatchAppMembers]);

  const appMember = await AppMember.findByPk(memberId);

  assertKoaError(!appMember, ctx, 404, 'App member not found');

  const payload: Partial<AppMemberInfo> = {};

  if (properties !== undefined) {
    payload.properties = parseAppMemberProperties(properties);
  }

  if (role !== undefined) {
    payload.role = role;
  }

  const updatedAppMember = await appMember.update(payload);

  ctx.body = getAppMemberInfo(updatedAppMember);
}
