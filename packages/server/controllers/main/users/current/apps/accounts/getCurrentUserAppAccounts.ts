import { type AppAccount } from '@appsemble/types';
import { type Context } from 'koa';
import { literal } from 'sequelize';

import {
  App,
  AppMember,
  AppOAuth2Authorization,
  AppOAuth2Secret,
  AppSamlAuthorization,
  AppSamlSecret,
  Organization,
} from '../../../../../../models/index.js';
import { applyAppMessages, parseLanguage } from '../../../../../../utils/app.js';
import { getAppMemberInfo, getAppMemberSSO } from '../../../../../../utils/appMember.js';

export async function getCurrentUserAppAccounts(ctx: Context): Promise<void> {
  const { user: authSubject } = ctx;
  const {
    baseLanguage,
    language,
    query: includeOptions,
  } = parseLanguage(ctx, ctx.query?.language ?? []);

  const apps = await App.findAll({
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
        where: { UserId: authSubject!.id },
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
      ...includeOptions,
    ],
  });

  ctx.body = apps.map((app) => {
    applyAppMessages(app, language, baseLanguage);

    const appMember = app.AppMembers[0];

    return {
      app: app.toJSON(),
      appMemberInfo: getAppMemberInfo(appMember),
      sso: getAppMemberSSO(appMember),
    };
  }) as AppAccount[];
}
