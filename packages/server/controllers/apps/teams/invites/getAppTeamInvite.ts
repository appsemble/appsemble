import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { Team, TeamInvite } from '../../../../models/index.js';

export async function getAppTeamInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    queryParams: { code },
  } = ctx;

  const invite = await TeamInvite.findOne({
    where: { key: code },
    include: [{ model: Team, where: { AppId: appId } }],
  });

  assertKoaError(!invite, ctx, 404, `No invite found for code: ${code}`);

  ctx.body = invite;
}
