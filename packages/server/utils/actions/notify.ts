import { NotifyActionDefinition } from '@appsemble/types';
import { defaultLocale, remap } from '@appsemble/utils';

import { AppSubscription } from '../../models/index.js';
import { getRemapperContext } from '../app.js';
import { sendNotification } from '../sendNotification.js';
import { ServerActionParameters } from './index.js';

export async function notify({
  action,
  app,
  data,
  user,
}: ServerActionParameters<NotifyActionDefinition>): Promise<any> {
  const context = await getRemapperContext(
    app,
    app.definition.defaultLanguage || defaultLocale,
    user && {
      sub: user.id,
      name: user.name,
      email: user.primaryEmail,
      email_verified: Boolean(user.EmailAuthorizations?.[0]?.verified),
      zoneinfo: user.timezone,
    },
  );

  const to = remap(action.to, data, context) as string;

  await app?.reload({
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
            where: {
              UserId: to,
            },
          },
    ],
  });

  const title = remap(action.title, data, context) as string;
  const body = remap(action.body, data, context) as string;

  for (const subscription of app.AppSubscriptions) {
    sendNotification(app, subscription, { title, body });
  }
  return data;
}
