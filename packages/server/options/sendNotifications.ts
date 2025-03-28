import { type SendNotificationsParams } from '@appsemble/node-utils';

import { App, AppSubscription } from '../models/index.js';
import { sendNotification } from '../utils/sendNotification.js';

export async function sendNotifications({
  app,
  body,
  title,
  to,
}: SendNotificationsParams): Promise<void> {
  const persistedApp = await App.findByPk(app.id, {
    attributes: ['id', 'definition', 'vapidPrivateKey', 'vapidPublicKey'],
    include: [
      to === 'all'
        ? {
            model: AppSubscription,
            attributes: ['id', 'auth', 'p256dh', 'endpoint'],
          }
        : {
            model: AppSubscription,
            attributes: ['id', 'auth', 'p256dh', 'endpoint'],
            required: false,
            where: {
              AppMemberId: to,
            },
          },
    ],
  });

  for (const subscription of persistedApp.AppSubscriptions) {
    sendNotification(persistedApp, subscription, { title, body });
  }
}
