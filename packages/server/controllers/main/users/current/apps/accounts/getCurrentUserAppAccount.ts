import { assertKoaCondition } from '@appsemble/node-utils';
import { type AppAccount } from '@appsemble/types';
import { type Context } from 'koa';
import { literal } from 'sequelize';

import { App, getAppDB, Organization } from '../../../../../../models/index.js';
import { applyAppMessages, parseLanguage } from '../../../../../../utils/app.js';
import { getAppMemberInfo, getAppMemberSSO } from '../../../../../../utils/appMember.js';

export async function getCurrentUserAppAccount(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    user: authSubject,
  } = ctx;
  const {
    baseLanguage,
    language,
    query: includeOptions,
  } = parseLanguage(ctx, ctx.query?.language ?? []);

  const app = await App.findByPk(appId, {
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
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const {
    AppMember,
    AppOAuth2Authorization,
    AppOAuth2Secret,
    AppSamlAuthorization,
    AppSamlSecret,
  } = await getAppDB(appId);
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

  applyAppMessages(app, language, baseLanguage);

  assertKoaCondition(appMember != null, ctx, 404, 'App member not found');

  ctx.body = {
    app: app.toJSON(),
    appMemberInfo: getAppMemberInfo(appId, appMember),
    sso: getAppMemberSSO(appMember),
  } as AppAccount;
}
