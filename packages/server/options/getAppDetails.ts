import { type AppDetails, type GetAppParams } from '@appsemble/node-utils';

import { getApp as getServerApp } from '../utils/app.js';

export async function getAppDetails({ context, query }: GetAppParams): Promise<AppDetails> {
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  const { appPath, organizationId } = await getServerApp(context, query);
  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return { appPath, organizationId };
}
