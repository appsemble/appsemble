import { type AppDetails, type GetAppParams } from '@appsemble/node-utils';

export function getAppDetails({ context }: GetAppParams): Promise<AppDetails> {
  const { appsembleApp } = context;
  return Promise.resolve({
    appPath: appsembleApp.path,
    organizationId: appsembleApp.OrganizationId,
  });
}
