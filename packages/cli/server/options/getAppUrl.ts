import { GetAppSubEntityParams } from 'packages/node-utils/server/routes/types';

export const getAppUrl = ({ context }: GetAppSubEntityParams): Promise<URL> => {
  const url = new URL(context.appHost);
  return Promise.resolve(url);
};
