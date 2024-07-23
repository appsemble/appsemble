import { type AppMemberInfo } from '@appsemble/types';

import { argv } from './argv.js';
import { getGravatarUrl } from './gravatar.js';
import { AppMember } from '../models/index.js';

export function getAppMemberPicture(appMember: AppMember): string {
  return appMember.picture
    ? String(
        new URL(
          `/api/apps/${appMember.AppId}/members/${
            appMember.id
          }/picture?updated=${appMember.updated.getTime()}`,
          argv.host,
        ),
      )
    : getGravatarUrl(appMember.email);
}

export function getAppMemberInfo(appMember: AppMember): AppMemberInfo {
  return {
    sub: appMember.id,
    name: appMember.name,
    email: appMember.email,
    email_verified: appMember.emailVerified,
    picture: getAppMemberPicture(appMember),
    locale: appMember.locale,
    zoneinfo: appMember.timezone,
    properties: appMember.properties,
    role: appMember.role,
  } as AppMemberInfo;
}

export async function getAppMemberInfoById(id: string): Promise<AppMemberInfo> {
  const appMember = await AppMember.findByPk(id);
  return appMember ? getAppMemberInfo(appMember) : null;
}

export function parseAppMemberProperties(properties: any): Record<string, any> {
  const parsedAppMemberProperties: Record<string, any> = {};

  for (const [propertyName, propertyValue] of Object.entries(properties)) {
    try {
      parsedAppMemberProperties[propertyName] = JSON.parse(propertyValue as string);
    } catch {
      parsedAppMemberProperties[propertyName] = propertyValue;
    }
  }

  return parsedAppMemberProperties;
}
