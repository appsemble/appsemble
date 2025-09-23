import { type EmailParams } from '@appsemble/node-utils';

import { App } from '../models/index.js';
import { email as serverEmail } from '../utils/actions/email.js';

export async function email({
  action,
  context,
  data,
  mailer,
  options,
}: EmailParams): Promise<void> {
  const { getApp } = options;
  const {
    pathParams: { appId },
  } = context;
  const app = await getApp({ context, query: { attributes: ['id'], where: { id: appId } } });

  const persistedApp = (await App.findByPk(app.id, {
    attributes: [
      'definition',
      'domain',
      'emailName',
      'emailHost',
      'emailUser',
      'emailPassword',
      'emailPort',
      'emailSecure',
      'id',
      'OrganizationId',
      'path',
    ],
  }))!;

  await serverEmail({ app: persistedApp, action, data, mailer, options, context });
}
