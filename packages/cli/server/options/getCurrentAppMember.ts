import { type GetCurrentAppMemberParams } from '@appsemble/node-utils';
import { type AppMemberInfo } from '@appsemble/types';

export function getCurrentAppMember({
  context,
}: GetCurrentAppMemberParams): Promise<AppMemberInfo> {
  return Promise.resolve(context.appMemberInfo);
}
