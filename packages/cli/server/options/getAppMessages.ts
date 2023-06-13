import { type GetAppSubEntityParams } from '@appsemble/node-utils';
import { type AppMessages } from '@appsemble/types';

export function getAppMessages({ context }: GetAppSubEntityParams): Promise<AppMessages[]> {
  return Promise.resolve(context.appMessages);
}
