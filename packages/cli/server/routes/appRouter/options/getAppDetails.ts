import { AppDetails, GetAppParams } from 'packages/node-utils/server/routes/types';

export const getAppDetails = ({ context }: GetAppParams): Promise<AppDetails> => {
  const { appsembleApp } = context;
  return Promise.resolve({
    appPath: appsembleApp.path,
    organizationId: appsembleApp.OrganizationId,
  });
};
