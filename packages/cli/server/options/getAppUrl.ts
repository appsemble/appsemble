import { type GetAppSubEntityParams } from '@appsemble/node-utils';

export function getAppUrl({ context }: GetAppSubEntityParams): Promise<URL> {
  const url = new URL(context.appHost);
  return Promise.resolve(url);
}
