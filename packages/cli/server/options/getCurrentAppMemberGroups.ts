import { type GetAppSubEntityParams } from '@appsemble/node-utils';
import { type Group } from '@appsemble/types';

export const getCurrentAppMemberGroups = ({ context }: GetAppSubEntityParams): Promise<Group[]> =>
  Promise.resolve(context.appGroups);
