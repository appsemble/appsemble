import { AppDetails, GetAppParams } from '@appsemble/node-utils/types';

import { getApp as getServerApp } from '../../../utils/app.js';

export const getAppDetails = async ({ context, query }: GetAppParams): Promise<AppDetails> => {
  const { appPath, organizationId } = await getServerApp(context, query);
  return { appPath, organizationId };
};
