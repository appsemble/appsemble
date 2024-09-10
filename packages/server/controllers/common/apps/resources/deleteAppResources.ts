import { getResourceDefinition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppMember, Organization, Resource, type User } from '../../../../models/index.js';
import { options } from '../../../../options/options.js';
import {
  processHooks,
  processReferenceHooks,
  processReferenceTriggers,
} from '../../../../utils/resource.js';

export async function deleteAppResources(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceType },
    request: { body },
    user,
  } = ctx;
  const { verifyResourceActionPermission } = options;

  const action = 'delete';

  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'OrganizationId', 'vapidPrivateKey', 'vapidPublicKey'],
    include: user
      ? [
          { model: Organization, attributes: ['id'] },
          {
            model: AppMember,
            attributes: ['role', 'UserId'],
            required: false,
            where: { id: user.id },
          },
        ]
      : [],
  });

  getResourceDefinition(app.toJSON(), resourceType, ctx);
  const memberQuery = await verifyResourceActionPermission({
    context: ctx,
    app: app.toJSON(),
    resourceType,
    action,
    options,
    ctx,
  });

  let deletedAmount = 0;
  while (deletedAmount < body.length) {
    for (const resource of await Resource.findAll({
      where: {
        id: body.slice(deletedAmount, deletedAmount + 100),
        type: resourceType,
        AppId: appId,
        ...memberQuery,
      },
      limit: 100,
    })) {
      processReferenceHooks(user as User, app, resource, action, options, ctx);
      processHooks(user as User, app, resource, action, options, ctx);

      await processReferenceTriggers(app, resource, action, ctx);

      await resource.destroy();
    }
    deletedAmount += 100;
  }

  ctx.status = 204;
}
