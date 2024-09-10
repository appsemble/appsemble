import { type ExtendedGroup, type GetAppGroupsParams } from '@appsemble/node-utils';

export function getAppGroups({ context }: GetAppGroupsParams): Promise<ExtendedGroup[]> {
  return Promise.resolve(context.appGroups);
}
