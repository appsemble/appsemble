import { logger } from '@appsemble/node-utils';
import webpush from 'web-push';

import { argv } from './argv.js';
import { type App, type AppSubscription } from '../models/index.js';

export interface SendNotificationOptions {
  title: string;
  body: string;
  data: Record<string, unknown>;
}

export async function sendNotification(
  app: App,
  subscription: AppSubscription,
  options: SendNotificationOptions,
): Promise<void> {
  try {
    logger.verbose(
      `Sending push notification based on subscription ${subscription.id} for app ${app.id}`,
    );

    const { auth, endpoint, p256dh } = subscription;
    const { host, protocol } = new URL(argv.host);
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
          // TODO: Make this configurable
          // Important to be in the correct format for apple notifications
          subject: 'mailto:support@appsemble.com',
          publicKey: app.vapidPublicKey,
          privateKey: app.vapidPrivateKey,
        },
      },
    );
  } catch (error: unknown) {
    if (!(error instanceof webpush.WebPushError && error.statusCode === 410)) {
      throw error;
    }

    logger.error(`Failed to send notification: ${error instanceof Error ? error.message : error}`);

    logger.verbose(`Removing push notification subscription ${subscription.id} for app ${app.id}`);
    await subscription.destroy();
  }
}
