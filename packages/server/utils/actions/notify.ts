import { getRemapperContext } from '@appsemble/node-utils/app';
import { NotifyActionDefinition } from '@appsemble/types';
import { defaultLocale, remap } from '@appsemble/utils';

import { AppSubscription } from '../../models/index.js';
import { sendNotification } from '../sendNotification.js';
import { ServerActionParameters } from './index.js';

export async function notify({
  action,
  app,
  context,
  data,
  options,
  user,
}: ServerActionParameters<NotifyActionDefinition>): Promise<any> {
  const remapperContext = await getRemapperContext(
    app.toJSON(),
    app.definition.defaultLanguage || defaultLocale,
    user && {
      sub: user.id,
      name: user.name,
      email: user.primaryEmail,
      email_verified: Boolean(user.EmailAuthorizations?.[0]?.verified),
      zoneinfo: user.timezone,
    },
    options,
    context,
  );

  const to = remap(action.to, data, remapperContext) as string;

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
            required: false,
            where: {
              UserId: to,
            },
          },
    ],
  });

  const title = remap(action.title, data, remapperContext) as string;
  const body = remap(action.body, data, remapperContext) as string;

  for (const subscription of app.AppSubscriptions) {
    sendNotification(app, subscription, { title, body });
  }
  return data;
}
