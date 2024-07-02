import { type AppAccount, type SSOConfiguration } from '@appsemble/types';
import { type FindOptions, type IncludeOptions, literal } from 'sequelize';

import { applyAppMessages } from './app.js';
import { argv } from './argv.js';
import { getGravatarUrl } from './gravatar.js';
import {
  type App,
  AppMember,
  AppOAuth2Authorization,
  AppOAuth2Secret,
  AppSamlAuthorization,
  AppSamlSecret,
  Organization,
  type User,
} from '../models/index.js';

export function createAppMemberQuery(user: User, include: IncludeOptions[]): FindOptions {
  return {
    attributes: {
      include: [
        [literal('"App".icon IS NOT NULL'), 'hasIcon'],
        [literal('"maskableIcon" IS NOT NULL'), 'hasMaskableIcon'],
      ],
      exclude: ['App.icon', 'maskableIcon', 'coreStyle', 'sharedStyle'],
    },
    include: [
      {
        model: Organization,
        attributes: {
          include: [
            'id',
            'name',
            'updated',
            [literal('"Organization".icon IS NOT NULL'), 'hasIcon'],
          ],
        },
      },
      {
        model: AppMember,
        attributes: {
          exclude: ['picture'],
        },
        where: { UserId: user.id },
        include: [
          {
            model: AppSamlAuthorization,
            required: false,
            include: [AppSamlSecret],
          },
          {
            model: AppOAuth2Authorization,
            required: false,
            include: [AppOAuth2Secret],
          },
        ],
      },
      ...include,
    ],
  };
}

/**
 * Create an app member as JSON output from an app.
 *
 * @param app The app to output. A single app member should be present.
 * @param language The language to use.
 * @param baseLanguage The base language to use.
 * @returns The app member of the app.
 */
export function outputAppMember(app: App, language: string, baseLanguage: string): AppAccount {
  const [member] = app.AppMembers;

  applyAppMessages(app, language, baseLanguage);

  const sso: SSOConfiguration[] = [];

  if (member.AppOAuth2Authorizations) {
    for (const { AppOAuth2Secret: secret } of member.AppOAuth2Authorizations) {
      sso.push({
        type: 'oauth2',
        icon: secret.icon,
        url: secret.dataValues.authorizatio,
        name: secret.name,
      });
    }
  }
  if (member.AppSamlAuthorizations) {
    for (const { AppSamlSecret: secret } of member.AppSamlAuthorizations) {
      sso.push({
        type: 'saml',
        icon: secret.icon,
        url: secret.ssoUrl,
        name: secret.name,
      });
    }
  }

  return {
    app: app.toJSON(),
    id: member.id,
    email: member.email,
    emailVerified: member.emailVerified,
    picture: member.picture
      ? String(
          new URL(
            `/api/apps/${app.id}/members/${
              member.UserId
            }/picture?updated=${member.updated.getTime()}`,
            argv.host,
          ),
        )
      : getGravatarUrl(member.email),
    name: member.name,
    role: member.role,
    properties: member.properties ?? {},
    sso,
  };
}
