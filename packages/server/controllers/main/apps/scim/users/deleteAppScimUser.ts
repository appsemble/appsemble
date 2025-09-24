import { scimAssert } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { getAppDB } from '../../../../../models/index.js';

export async function deleteAppScimUser(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appMemberId },
  } = ctx;
  const { AppMember } = await getAppDB(appId);
  const deletedRows = await AppMember.destroy({ where: { id: appMemberId, AppId: appId } });
  scimAssert(deletedRows, ctx, 404, 'User not found');
}
