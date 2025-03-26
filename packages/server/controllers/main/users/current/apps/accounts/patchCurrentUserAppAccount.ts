import { AppMemberPropertiesError, assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
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

export async function patchCurrentUserAppAccount(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { name, picture },
    },
    user: authSubject,
  } = ctx;

  const {
    baseLanguage,
    language,
    query: includeOptions,
  } = parseLanguage(ctx, ctx.query?.language ?? []);

  const app = await App.findOne({
    where: { id: appId },
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

  const appMember = await AppMember.findOne({
    where: {
      AppId: appId,
      UserId: authSubject!.id,
    },
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

  assertKoaCondition(appMember != null, ctx, 404, 'App member not found');

  const result: Partial<AppMember> = {};

  if (name != null) {
    result.name = name;
  }

  if (picture) {
    result.picture = picture.contents;
  }

  try {
    await appMember.update(result);
  } catch (error) {
    if (error instanceof AppMemberPropertiesError) {
      throwKoaError(ctx, 400, error.message);
    }
  }

  applyAppMessages(app, language, baseLanguage);

  await appMember.reload();

  ctx.body = {
    app: app.toJSON(),
    appMemberInfo: getAppMemberInfo(appMember),
    sso: getAppMemberSSO(appMember),
  } as AppAccount;
}
