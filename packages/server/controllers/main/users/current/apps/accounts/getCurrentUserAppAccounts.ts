import { type AppAccount } from '@appsemble/types';
import { type Context } from 'koa';
import { literal } from 'sequelize';

import { App, getAppDB, Organization, UserAppAccount } from '../../../../../../models/index.js';
import { applyAppMessages, parseLanguage } from '../../../../../../utils/app.js';
import { getAppMemberInfo, getAppMemberSSO } from '../../../../../../utils/appMember.js';

export async function getCurrentUserAppAccounts(ctx: Context): Promise<void> {
  const { user: authSubject } = ctx;
  const {
    baseLanguage,
    language,
    query: includeOptions,
  } = parseLanguage(ctx, ctx.query?.language ?? []);

  const userAppAccounts = await UserAppAccount.findAll({
    attributes: ['AppId'],
    where: { UserId: authSubject!.id },
  });
  const apps = await App.findAll({
    where: { id: userAppAccounts.map(({ AppId }) => AppId) },
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
      ...includeOptions,
    ],
  });

  const appAccounts: AppAccount[] = [];
  // Opening the app databases one at a time keeps the number of database connections bounded.
  for (const app of apps) {
    const {
      AppMember,
      AppOAuth2Authorization,
      AppOAuth2Secret,
      AppSamlAuthorization,
      AppSamlSecret,
    } = await getAppDB(app.id);

    const appMember = await AppMember.findOne({
      attributes: { exclude: ['picture'] },
      where: { userId: authSubject!.id },
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
    });

    if (!appMember) {
      // App members are deleted in their app database only, so the account record is dropped once
      // its app member is gone.
      await UserAppAccount.destroy({ where: { UserId: authSubject!.id, AppId: app.id } });
      continue;
    }

    applyAppMessages(app, language, baseLanguage);
    appAccounts.push({
      app: app.toJSON(),
      appMemberInfo: getAppMemberInfo(app.id, appMember),
      sso: getAppMemberSSO(appMember),
    });
  }

  ctx.body = appAccounts;
}
