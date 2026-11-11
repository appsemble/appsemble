import { type Context } from 'koa';

import { App, getAppDB } from '../../../models/index.js';
import { getAppStyle } from '../../../utils/app.js';

export async function getAppBlockStyle(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, blockId, organizationId },
  } = ctx;
  const { AppBlockStyle } = await getAppDB(appId);
  const app = (await App.findByPk(appId, { attributes: ['id', 'password'] }))!;
  const blockStyle = await AppBlockStyle.findOne({
    where: { block: `@${organizationId}/${blockId}` },
  });

  ctx.body = getAppStyle(app, blockStyle?.style);
  ctx.type = 'css';
  ctx.status = 200;
}
