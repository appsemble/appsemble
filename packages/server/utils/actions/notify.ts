import { getRemapperContext } from '@appsemble/node-utils';
import { type NotifyActionDefinition } from '@appsemble/types';
import { defaultLocale, remap } from '@appsemble/utils';

import { type ServerActionParameters } from './index.js';
import { AppSubscription } from '../../models/index.js';
import { sendNotification } from '../sendNotification.js';

export async function notify({
  action,
  app,
  context,
  data,
  options,
}: ServerActionParameters<NotifyActionDefinition>): Promise<any> {
  const remapperContext = await getRemapperContext(
    app.toJSON(),
    app.definition.defaultLanguage || defaultLocale,
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
