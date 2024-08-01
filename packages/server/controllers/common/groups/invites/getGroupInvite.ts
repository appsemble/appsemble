import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { Group, GroupInvite } from '../../../../models/index.js';

export async function getGroupInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    queryParams: { code },
  } = ctx;

  const invite = await GroupInvite.findOne({
    where: { key: code },
    include: [{ model: Group, where: { AppId: appId } }],
  });

  assertKoaError(!invite, ctx, 404, `No invite found for code: ${code}`);

  ctx.body = invite;
}
