import { getAppRoles } from '@appsemble/lang-sdk';
import { type SendNotificationsParams } from '@appsemble/node-utils';
import { Op } from 'sequelize';

import { App, getAppDB } from '../models/index.js';
import { getAppMemberIdsByRoles } from '../utils/appMember.js';
import { sendNotification } from '../utils/sendNotification.js';

export async function sendNotifications({
  app,
  body,
  link,
  title,
  to,
}: SendNotificationsParams): Promise<void> {
  const { AppSubscription } = await getAppDB(app.id!);
  const persistedApp = (await App.findByPk(app.id, {
    attributes: ['id', 'definition', 'vapidPrivateKey', 'vapidPublicKey'],
  }))!;

  const appRoles = getAppRoles(app.definition.security);
  const toValidRoles = Array.isArray(to)
    ? to.filter((item) => appRoles.includes(item))
    : appRoles.includes(to)
      ? [to]
      : [];

  const memberIds = toValidRoles.length ? await getAppMemberIdsByRoles(app.id!, toValidRoles) : [];

  if (to !== 'all' && (appRoles.includes(to as string) || toValidRoles.length) && !memberIds.length) {
    return;
  }

  const appSubscriptions = await AppSubscription.findAll({
    attributes: ['id', 'auth', 'p256dh', 'endpoint'],
    ...(to === 'all'
      ? {}
      : appRoles.includes(to as string) || toValidRoles.length
        ? {
            where: {
              AppMemberId: {
                [Op.in]: memberIds,
              },
            },
          }
        : { where: { AppMemberId: to } }),
  });

  for (const subscription of appSubscriptions) {
    sendNotification(persistedApp, subscription, { title, body, link });
  }
}
