import { type GetAppMemberParams } from '@appsemble/node-utils';
import { type AppMember } from '@appsemble/types';

export function getAppMember({ context }: GetAppMemberParams): Promise<AppMember | null> {
  return Promise.resolve(context.appMembers[0]);
}
