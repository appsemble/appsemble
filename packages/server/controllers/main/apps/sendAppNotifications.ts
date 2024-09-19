import { assertKoaError, logger } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppSubscription } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import { sendNotification } from '../../../utils/sendNotification.js';

export async function sendAppNotifications(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { body, title },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppSubscription, attributes: ['id', 'auth', 'p256dh', 'endpoint'] }],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    requiredPermissions: [OrganizationPermission.PushAppNotifications],
    organizationId: app.OrganizationId,
  });

  // XXX: Replace with paginated requests
  logger.verbose(`Sending ${app.AppSubscriptions.length} notifications for app ${appId}`);

  for (const subscription of app.AppSubscriptions) {
    sendNotification(app, subscription, { title, body });
  }
}
