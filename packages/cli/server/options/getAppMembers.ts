import { type GetAppMembersParams } from '@appsemble/node-utils';
import { type AppMember } from '@appsemble/types';

export function getAppMembers({ context }: GetAppMembersParams): Promise<AppMember[]> {
  return Promise.resolve(context.appMembers);
}
