import { scimAssert } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { AppMember } from '../../../../../models/index.js';

export async function deleteAppScimUser(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId },
  } = ctx;

  const deletedRows = await AppMember.destroy({ where: { id: memberId, AppId: appId } });
  scimAssert(deletedRows, ctx, 404, 'User not found');
}
