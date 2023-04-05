import { GetAppSubEntityParams } from '@appsemble/node-utils/server/types';

export const getAppUrl = ({ context }: GetAppSubEntityParams): Promise<URL> => {
  const url = new URL(context.appHost);
  return Promise.resolve(url);
};
