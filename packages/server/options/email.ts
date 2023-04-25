import { EmailParams } from '@appsemble/node-utils/server/types';

import { App } from '../models/index.js';
import { email as serverEmail } from '../utils/actions/email.js';

export const email = async ({
  action,
  context,
  data,
  mailer,
  options,
  user,
}: EmailParams): Promise<void> => {
  const { getApp } = options;
  const app = await getApp({ context });

  const persistedApp = await App.findByPk(app.id, {
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
  });

  await serverEmail({ app: persistedApp, action, data, mailer, user, options, context });
};
