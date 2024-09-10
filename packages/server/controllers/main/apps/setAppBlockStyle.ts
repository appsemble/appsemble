import { assertKoaError, throwKoaError } from '@appsemble/node-utils';
import { Permissions, StyleValidationError, validateStyle } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppBlockStyle, BlockVersion } from '../../../models/index.js';
import { checkAppLock } from '../../../utils/checkAppLock.js';
import { checkRole } from '../../../utils/checkRole.js';

export async function setAppBlockStyle(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, blockId, organizationId },
    request: {
      body: { style },
    },
  } = ctx;
  const css = String(style).trim();

  try {
    const app = await App.findByPk(appId, { attributes: ['locked', 'OrganizationId'] });

    assertKoaError(!app, ctx, 404, 'App not found');
    checkAppLock(ctx, app);
    validateStyle(css);

    const block = await BlockVersion.findOne({
      where: { name: blockId, OrganizationId: organizationId },
    });

    assertKoaError(!block, ctx, 404, 'Block not found');

    await checkRole(ctx, app.OrganizationId, Permissions.EditApps);

    await (css.length
      ? AppBlockStyle.upsert({
          style: css,
          AppId: appId,
          block: `@${block.OrganizationId}/${block.name}`,
        })
      : AppBlockStyle.destroy({
          where: { AppId: appId, block: `@${block.OrganizationId}/${block.name}` },
        }));

    ctx.status = 204;
  } catch (error: unknown) {
    if (error instanceof StyleValidationError) {
      throwKoaError(ctx, 400, 'Provided CSS was invalid.');
    }

    throw error;
  }
}
