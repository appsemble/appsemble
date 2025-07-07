import { getAppRoles } from '@appsemble/lang-sdk';
import { type SendNotificationsParams } from '@appsemble/node-utils';

import { App, AppMember, AppSubscription } from '../models/index.js';
import { sendNotification } from '../utils/sendNotification.js';

export async function sendNotifications({
  app,
  body,
  title,
  to,
}: SendNotificationsParams): Promise<void> {
  const appRoles = getAppRoles(app.definition.security);
  const toValidRoles = Array.isArray(to)
    ? to.filter((item) => appRoles.includes(item))
    : appRoles.includes(to)
      ? [to]
      : [];
  const persistedApp = (await App.findByPk(app.id, {
    attributes: ['id', 'definition', 'vapidPrivateKey', 'vapidPublicKey'],
    include: [
      to === 'all'
        ? {
            model: AppSubscription,
            attributes: ['id', 'auth', 'p256dh', 'endpoint'],
          }
        : appRoles.includes(to) || toValidRoles.length
          ? {
              model: AppSubscription,
              attributes: ['id', 'auth', 'p256dh', 'endpoint'],
              required: false,
              include: [
                {
                  model: AppMember,
                  where: {
                    role: toValidRoles,
                  },
                },
              ],
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
  }))!;

  for (const subscription of persistedApp.AppSubscriptions) {
    sendNotification(persistedApp, subscription, { title, body });
  }
}
