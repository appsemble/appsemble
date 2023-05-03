import { type GetAppParams } from '@appsemble/node-utils';
import { type App as AppInterface } from '@appsemble/types';

export function getApp({ context }: GetAppParams): Promise<AppInterface> {
  const { appsembleApp } = context;
  return Promise.resolve(appsembleApp);
}
