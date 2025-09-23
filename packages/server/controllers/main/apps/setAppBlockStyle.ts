import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { StyleValidationError, validateStyle } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, BlockVersion, getAppDB } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import { checkAppLock } from '../../../utils/checkAppLock.js';

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

    assertKoaCondition(app != null, ctx, 404, 'App not found');
    checkAppLock(ctx, app);
    validateStyle(css);

    const block = await BlockVersion.findOne({
      where: { name: blockId, OrganizationId: organizationId },
    });

    assertKoaCondition(block != null, ctx, 404, 'Block not found');

    await checkUserOrganizationPermissions({
      context: ctx,
      organizationId: app.OrganizationId,
      requiredPermissions: [OrganizationPermission.UpdateAppSettings],
    });

    const { AppBlockStyle } = await getAppDB(appId);
    await (css.length
      ? AppBlockStyle.upsert({
          style: css,
          block: `@${block.OrganizationId}/${block.name}`,
        })
      : AppBlockStyle.destroy({
          where: { block: `@${block.OrganizationId}/${block.name}` },
        }));

    ctx.status = 204;
  } catch (error: unknown) {
    if (error instanceof StyleValidationError) {
      throwKoaError(ctx, 400, 'Provided CSS was invalid.');
    }

    throw error;
  }
}
