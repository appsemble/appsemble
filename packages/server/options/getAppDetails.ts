import { type AppDetails, type GetAppParams } from '@appsemble/node-utils';

import { getApp as getServerApp } from '../utils/app.js';

export async function getAppDetails({ context, query }: GetAppParams): Promise<AppDetails> {
  const { appPath, organizationId } = await getServerApp(context, query);
  return { appPath, organizationId };
}
