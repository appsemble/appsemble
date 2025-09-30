import { defaultLocale, type NotifyActionDefinition, remap } from '@appsemble/lang-sdk';
import { getRemapperContext } from '@appsemble/node-utils';

import { type ServerActionParameters } from './index.js';
import { getAppDB } from '../../models/index.js';
import { sendNotification } from '../sendNotification.js';

export async function notify({
  action,
  app,
  context,
  data,
  internalContext,
  options,
}: ServerActionParameters<NotifyActionDefinition>): Promise<any> {
  const { AppSubscription } = await getAppDB(app.id);

  const remapperContext = await getRemapperContext(
    app.toJSON(),
    app.definition.defaultLanguage || defaultLocale,
    options,
    context,
  );

  Object.assign(remapperContext, {
    history: internalContext?.history ?? [],
  });

  const to = remap(action.to, data, remapperContext) as string;

  await app?.reload({ attributes: ['id', 'definition', 'vapidPrivateKey', 'vapidPublicKey'] });
  const appSubscriptions = await AppSubscription.findAll({
    attributes: ['id', 'auth', 'p256dh', 'endpoint'],
    ...(to === 'all' ? {} : { where: { AppMemberId: to } }),
  });

  const title = remap(action.title, data, remapperContext) as string;
  const body = remap(action.body, data, remapperContext) as string;
  const link = remap(action.link, data, remapperContext) as string;

  for (const subscription of appSubscriptions) {
    sendNotification(app, subscription, { title, body, link });
  }
  return data;
}
