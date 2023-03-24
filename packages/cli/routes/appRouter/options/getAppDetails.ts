import { AppDetails, GetAppParams } from '@appsemble/node-utils/types';

export const getAppDetails = ({ context }: GetAppParams): Promise<AppDetails> => {
  const { appsembleApp } = context;
  return Promise.resolve({
    appPath: appsembleApp.path,
    organizationId: appsembleApp.OrganizationId,
  });
};
