import { type ExtendedGroup, type GetAppSubEntityParams } from '@appsemble/node-utils';

export function getAppGroups({ context }: GetAppSubEntityParams): Promise<ExtendedGroup[]> {
  return Promise.resolve(context.appGroups);
}
