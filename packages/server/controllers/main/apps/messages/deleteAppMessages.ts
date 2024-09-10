import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMessages } from '../../../../models/index.js';
import { checkAppLock } from '../../../../utils/checkAppLock.js';
import { checkRole } from '../../../../utils/checkRole.js';

export async function deleteAppMessages(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, language },
  } = ctx;

  const app = await App.findOne({
    attributes: ['locked', 'OrganizationId'],
    where: { id: appId },
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, Permission.EditAppMessages);

  const affectedRows = await AppMessages.destroy({
    where: { language: language.toLowerCase(), AppId: appId },
  });

  assertKoaError(!affectedRows, ctx, 404, `App does not have messages for “${language}”`);
}
