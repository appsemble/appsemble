import { GetAppParams } from '@appsemble/node-utils/server/types.js';
import { App as AppInterface } from '@appsemble/types';

export const getApp = ({ context }: GetAppParams): Promise<AppInterface> => {
  const { appsembleApp } = context;
  return Promise.resolve(appsembleApp);
};
