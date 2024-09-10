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
import { parseLanguage } from '../../../../../../utils/app.js';

export async function getCurrentUserAppMembers(ctx: Context): Promise<void> {
  const { user: authSubject } = ctx;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { baseLanguage, language, query: includeOptions } = parseLanguage(ctx, ctx.query?.language);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        where: { UserId: authSubject.id },
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

  // TODO fix this
  // ctx.body = apps.map((app) => outputAppMember(app, language, baseLanguage));
}
