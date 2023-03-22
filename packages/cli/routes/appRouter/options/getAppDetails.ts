import { AppDetails, GetAppParams } from '@appsemble/node-utils/types';

import { getApp as getCliApp } from '../../../mocks/utils/app.js';

export const getAppDetails = async ({ context, query }: GetAppParams): Promise<AppDetails> => {
  const { appPath, organizationId } = await getCliApp(context, query);
  return { appPath, organizationId };
};
