import { logger } from '@appsemble/node-utils';
import webpush from 'web-push';

export default async function sendNotification(app, ctx, subscription, options) {
  try {
    logger.verbose(
      `Sending push notification based on subscription ${subscription.id} for app ${app.id}`,
    );

    const { auth, p256dh, endpoint } = subscription;

    await webpush.sendNotification(
      {
        endpoint,
        keys: { auth, p256dh },
      },
      JSON.stringify({
        icon: `${ctx.argv.host}/${app.id}/icon-96.png`,
        badge: `${ctx.argv.host}/${app.id}/icon-96.png`,
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
