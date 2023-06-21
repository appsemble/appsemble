import { type GetAppUserInfoParams } from '@appsemble/node-utils';
import { type UserInfo } from '@appsemble/types';

export function getAppUserInfo({ context }: GetAppUserInfoParams): Promise<UserInfo> {
  return Promise.resolve(context.appUserInfo);
}
