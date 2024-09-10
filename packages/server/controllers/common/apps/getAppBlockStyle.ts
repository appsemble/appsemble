import { type Context } from 'koa';

import { AppBlockStyle } from '../../../models/index.js';

export async function getAppBlockStyle(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, blockId, organizationId },
  } = ctx;

  const blockStyle = await AppBlockStyle.findOne({
    where: {
      AppId: appId,
      block: `@${organizationId}/${blockId}`,
    },
  });

  ctx.body = blockStyle?.style || '';
  ctx.type = 'css';
  ctx.status = 200;
}
