import { type Context } from 'koa';
import { literal } from 'sequelize';

import { App, getAppDB, Organization } from '../../../../../../models/index.js';
import { applyAppMessages, parseLanguage } from '../../../../../../utils/app.js';
import { getAppMemberInfo, getAppMemberSSO } from '../../../../../../utils/appMember.js';

export async function getCurrentUserAppAccounts(ctx: Context): Promise<void> {
  const { user: authSubject } = ctx;
  const {
    baseLanguage,
    language,
    query: includeOptions,
  } = parseLanguage(ctx, ctx.query?.language ?? []);

  // Disable endpoint for now as it overloads the server causing a temporary outage
  ctx.body = [];
  return;

  // eslint-disable-next-line no-unreachable
  const apps = (
    await App.findAll({
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
    })
  ).filter((app) => app.definition.security);

  const appAccounts = await Promise.all(
    apps.map(async (app) => {
      applyAppMessages(app, language, baseLanguage);

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
        return;
      }

      return {
        app: app.toJSON(),
        appMemberInfo: getAppMemberInfo(app.id, appMember),
        sso: getAppMemberSSO(appMember),
      };
    }),
  );

  // eslint-disable-next-line no-unreachable
  ctx.body = appAccounts.filter((appAccount) => appAccount !== undefined);
}
