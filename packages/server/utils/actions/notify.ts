import { NotifyActionDefinition } from '@appsemble/types';
import { defaultLocale, remap } from '@appsemble/utils';

import { App, AppSubscription } from '../../models/index.js';
import { getRemapperContext } from '../app.js';
import { sendNotification } from '../sendNotification.js';
import { ServerActionParameters } from './index.js';

export async function notify({
  action,
  app: { id: appId },
  data,
  user,
}: ServerActionParameters<NotifyActionDefinition>): Promise<any> {
  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'vapidPrivateKey', 'vapidPublicKey'],
    include: [
      {
        model: AppSubscription,
        attributes: ['id', 'auth', 'p256dh', 'endpoint'],
      },
    ],
  });

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

  const title = remap(action.title, data, context) as string;
  const body = remap(action.body, data, context) as string;

  if (action.to === 'all') {
    for (const subscription of app.AppSubscriptions) {
      sendNotification(app, subscription, { title, body });
    }
    return data;
  }

  const subscribedUser = app.AppSubscriptions.find(
    (sub) => sub.UserId === remap(action.to, data, context),
  );

  if (subscribedUser) {
    sendNotification(app, subscribedUser, { title, body });
  }

  return data;
}
