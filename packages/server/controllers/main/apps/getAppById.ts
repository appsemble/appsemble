import { assertKoaCondition } from '@appsemble/node-utils';
import { type App as AppType, OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';
import { col, fn, literal } from 'sequelize';

import {
  App,
  AppRating,
  AppReadme,
  AppScreenshot,
  AppSnapshot,
  Organization,
} from '../../../models/index.js';
import { applyAppMessages, parseLanguage } from '../../../utils/app.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';

export async function getAppById(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const {
    baseLanguage,
    language,
    query: languageQuery,
  } = parseLanguage(ctx, ctx.query?.language ?? []);

  const languageScreenshot = await AppScreenshot.findOne({
    attributes: ['language'],
    where: {
      AppId: appId,
      ...(language ? { language } : {}),
    },
  });

  const unspecifiedScreenshot = await AppScreenshot.findOne({
    attributes: ['language'],
    where: {
      AppId: appId,
      language: 'unspecified',
    },
  });

  const languageReadme = await AppReadme.findOne({
    attributes: ['language'],
    where: {
      AppId: appId,
      ...(language ? { language } : {}),
    },
  });

  const unspecifiedReadme = await AppReadme.findOne({
    attributes: ['language'],
    where: {
      AppId: appId,
      language: 'unspecified',
    },
  });

  const app = await App.findByPk(appId, {
    attributes: {
      include: [
        [literal('"App".icon IS NOT NULL'), 'hasIcon'],
        [literal('"maskableIcon" IS NOT NULL'), 'hasMaskableIcon'],
      ],
      exclude: ['App.icon', 'maskableIcon', 'coreStyle', 'sharedStyle'],
    },
    include: [
      // {
      //   model: Resource,
      //   attributes: ['id', 'clonable'],
      //   required: false,
      //   separate: true,
      // },
      // {
      //   model: Asset,
      //   attributes: ['id', 'clonable'],
      //   required: false,
      //   separate: true,
      // },
      { model: AppSnapshot, as: 'AppSnapshots', order: [['created', 'DESC']], limit: 1 },
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
        model: AppScreenshot,
        attributes: ['id', 'index', 'language'],
        where: {
          language:
            language && languageScreenshot
              ? language
              : unspecifiedScreenshot
                ? 'unspecified'
                : 'en',
        },
        required: false,
      },
      {
        model: AppReadme,
        attributes: ['id', 'language'],
        where: {
          language:
            language && languageReadme ? language : unspecifiedReadme ? 'unspecified' : 'en',
        },
        required: false,
      },
      ...languageQuery,
    ],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const propertyFilters: (keyof AppType)[] = [];
  if (app.visibility === 'private' || !app.showAppDefinition) {
    try {
      await checkUserOrganizationPermissions({
        context: ctx,
        organizationId: app.OrganizationId,
        requiredPermissions: [OrganizationPermission.QueryApps],
      });
    } catch (error) {
      if (app.visibility === 'private') {
        throw error;
      }
      propertyFilters.push('yaml', 'definition');
    }
  }

  const rating = await AppRating.findOne({
    attributes: [
      'AppId',
      [fn('AVG', col('rating')), 'RatingAverage'],
      [fn('COUNT', col('AppId')), 'RatingCount'],
    ],
    where: { AppId: app.id },
    group: ['AppId'],
  });

  if (rating) {
    app.RatingCount = Number(rating.get('RatingCount'));
    app.RatingAverage = Number(rating.get('RatingAverage'));
  }

  applyAppMessages(app, language, baseLanguage);

  ctx.status = 200;
  if (propertyFilters.includes('definition')) {
    const { defaultLanguage, defaultPage, description, name } = app.definition;
    ctx.body = Object.assign(app.toJSON(propertyFilters), {
      definition: {
        name,
        description,
        defaultLanguage,
        defaultPage,
        ...(app.definition.resources ? { resources: {} } : {}),
        ...(app.definition.security ? { security: {} } : {}),
      },
    });
    return;
  }
  ctx.body = app.toJSON(propertyFilters);
}
