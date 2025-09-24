import { assertKoaCondition, logger, throwKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import { sendNotification } from '../../../utils/sendNotification.js';

export async function sendAppNotifications(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { body, link, title },
    },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['id', 'OrganizationId', 'path', 'vapidPublicKey', 'vapidPrivateKey'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    requiredPermissions: [OrganizationPermission.PushAppNotifications],
    organizationId: app.OrganizationId,
  });

  const { AppSubscription } = await getAppDB(appId);
  const appSubscriptions = await AppSubscription.findAll({
    attributes: ['id', 'auth', 'p256dh', 'endpoint'],
  });

  // XXX: Replace with paginated requests
  logger.verbose(`Sending ${appSubscriptions.length} notifications for app ${appId}`);

  try {
    await Promise.all(
      appSubscriptions.map((subscription) =>
        sendNotification(app, subscription, { title, body, link }),
      ),
    );
  } catch (error) {
    logger.error(error);
    throwKoaError(ctx, 500, 'There was a problem sending notifications');
  }
}
