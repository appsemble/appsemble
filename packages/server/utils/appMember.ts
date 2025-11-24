import {
  type AppMemberInfo,
  type Group as GroupType,
  type SSOConfiguration,
} from '@appsemble/types';
import { type WhereOptions } from 'sequelize';

import { argv } from './argv.js';
import { getGravatarUrl } from './gravatar.js';
import { odataFilterToSequelize } from './odata.js';
import { type AppMember, getAppDB } from '../models/index.js';

export function getAppMemberPicture(appId: number, appMember: AppMember): string {
  return appMember.picture
    ? String(
        new URL(
          `/api/apps/${appId}/app-members/${appMember.id}/picture?updated=${appMember.updated.getTime()}`,
          argv.host,
        ),
      )
    : getGravatarUrl(appMember.email);
}

export function getAppMemberInfo(appId: number, appMember: AppMember): AppMemberInfo {
  return {
    sub: appMember.id,
    name: appMember.name,
    email: appMember.email,
    email_verified: appMember.emailVerified,
    picture: getAppMemberPicture(appId, appMember),
    locale: appMember.locale,
    zoneinfo: appMember.timezone,
    properties: appMember.properties,
    role: appMember.role,
    demo: appMember.demo,
    phoneNumber: appMember.phoneNumber,
    $seed: appMember.seed,
    $ephemeral: appMember.ephemeral,
    unverifiedEmail: appMember.AppMemberEmailAuthorizations?.[0]?.email,
  } as AppMemberInfo;
}

export async function getAppMemberGroups(appId: number, id: string): Promise<GroupType[]> {
  const { Group, GroupMember } = await getAppDB(appId);
  const appMemberGroups = await Group.findAll({
    include: [
      {
        model: GroupMember,
        where: { AppMemberId: id },
        required: true,
        as: 'Members',
      },
    ],
  });

  return appMemberGroups.map((group) => ({
    id: group.id,
    name: group.name,
  }));
}

export async function getAppMemberInfoById(appId: number, id: string): Promise<AppMemberInfo> {
  const { AppMember, AppMemberEmailAuthorization } = await getAppDB(appId);
  const appMember = await AppMember.findByPk(id, {
    include: { model: AppMemberEmailAuthorization, required: false },
  });
  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return appMember ? getAppMemberInfo(appId, appMember) : null;
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

export function getAppMemberSSO(appMember: AppMember): SSOConfiguration[] {
  const sso: SSOConfiguration[] = [];

  if (appMember?.AppOAuth2Authorizations) {
    for (const { AppOAuth2Secret: secret } of appMember.AppOAuth2Authorizations) {
      sso.push({
        type: 'oauth2',
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        icon: secret?.icon,
        // TODO: SEVERE typo
        url: secret?.dataValues.authorizatio,
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        name: secret?.name,
      });
    }
  }

  if (appMember?.AppSamlAuthorizations) {
    for (const { AppSamlSecret: secret } of appMember.AppSamlAuthorizations) {
      sso.push({
        type: 'saml',
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        icon: secret?.icon,
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        url: secret?.ssoUrl,
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        name: secret?.name,
      });
    }
  }

  return sso;
}

function renameMemberOData(name: string): string {
  switch (name) {
    case '__created__':
      return 'created';
    case '__updated__':
      return 'updated';
    case '$seed':
      return 'seed';
    case '$ephemeral':
      return 'ephemeral';
    case 'id':
    case 'email':
    case 'name':
    case 'locale':
    case 'role':
    case 'timezone':
      return name;
    default:
      return `properties.${name}`;
  }
}

export function parseMemberFilterQuery(filter: string): WhereOptions {
  return odataFilterToSequelize(filter ?? '', 'AppMember', renameMemberOData);
}
