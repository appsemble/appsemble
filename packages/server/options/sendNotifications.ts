import { SendNotificationsParams } from '@appsemble/node-utils/server/types';

import { App, AppSubscription } from '../models/index.js';
import { sendNotification } from '../utils/sendNotification.js';

export const sendNotifications = async ({
  app,
  body,
  title,
  to,
}: SendNotificationsParams): Promise<void> => {
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
              UserId: to,
            },
          },
    ],
  });

  for (const subscription of persistedApp.AppSubscriptions) {
    sendNotification(persistedApp, subscription, { title, body });
  }
};
