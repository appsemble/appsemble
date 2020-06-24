import { logger } from '@appsemble/node-utils';
import { URL } from 'url';
import webpush from 'web-push';

import type { App, AppSubscription } from '../models';
import type { KoaContext } from '../types';

export interface SendNotificationOptions {
  title: string;
  body: string;
}

export default async function sendNotification(
  ctx: KoaContext,
  app: App,
  subscription: AppSubscription,
  options: SendNotificationOptions,
): Promise<void> {
  try {
    logger.verbose(
      `Sending push notification based on subscription ${subscription.id} for app ${app.id}`,
    );

    const { auth, endpoint, p256dh } = subscription;
    const { host, protocol } = new URL(ctx.argv.host);
    const icon = `${protocol}//${app.path}.${app.OrganizationId}.${host}/icon-96.png`;

    await webpush.sendNotification(
      {
        endpoint,
        keys: { auth, p256dh },
      },
      JSON.stringify({
        icon,
        badge: icon,
        timestamp: Date.now(),
        ...options,
      }),
      {
        vapidDetails: {
          // XXX: Make this configurable
          subject: 'mailto: support@appsemble.com',
          publicKey: app.vapidPublicKey,
          privateKey: app.vapidPrivateKey,
        },
      },
    );
  } catch (error) {
    if (!(error instanceof webpush.WebPushError && error.statusCode === 410)) {
      throw error;
    }

    logger.verbose(`Removing push notification subscription ${subscription.id} for app ${app.id}`);
    await subscription.destroy();
  }
}
