import { type Context } from 'koa';

import { getAppDB } from '../../../models/index.js';

export async function getAppBlockStyle(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, blockId, organizationId },
  } = ctx;
  const { AppBlockStyle } = await getAppDB(appId);
  const blockStyle = await AppBlockStyle.findOne({
    where: { block: `@${organizationId}/${blockId}` },
  });

  ctx.body = blockStyle?.style || '';
  ctx.type = 'css';
  ctx.status = 200;
}
