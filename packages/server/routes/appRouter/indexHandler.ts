import { randomBytes } from 'crypto';

import {
  createThemeURL,
  defaultLocale,
  getAppBlocks,
  mergeThemes,
  parseBlockName,
} from '@appsemble/utils';
import { Context } from 'koa';
import { Op } from 'sequelize';

import {
  AppMessages,
  AppOAuth2Secret,
  AppSamlSecret,
  BlockAsset,
  BlockVersion,
} from '../../models';
import { getApp } from '../../utils/app';
import { argv } from '../../utils/argv';
import { organizationBlocklist } from '../../utils/organizationBlocklist';
import { createGtagCode, createSettings, makeCSP, render } from '../../utils/render';
import { getSentryClientSettings } from '../../utils/sentry';
import { bulmaURL, faURL } from '../../utils/styleURL';

/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 *
 * @param ctx - The Koa context.
 * @returns void
 */
export async function indexHandler(ctx: Context): Promise<void> {
  const { hostname } = ctx;
  const { host } = argv;

  const { app, appPath, organizationId } = await getApp(ctx, {
    attributes: [
      'domain',
      'definition',
      'googleAnalyticsID',
      'sentryDsn',
      'sentryEnvironment',
      'id',
      'sharedStyle',
      'coreStyle',
      'vapidPublicKey',
      'showAppsembleLogin',
      'showAppsembleOAuth2Login',
      'updated',
    ],
    include: [
      {
        attributes: ['icon', 'id', 'name'],
        model: AppOAuth2Secret,
      },
      {
        attributes: ['language'],
        model: AppMessages,
      },
      {
        attributes: ['icon', 'id', 'name'],
        model: AppSamlSecret,
      },
    ],
  });

  if (!app) {
    if (organizationId && !appPath) {
      return ctx.redirect(
        organizationBlocklist.includes(organizationId)
          ? host
          : String(new URL(`/organizations/${organizationId}`, host)),
      );
    }
    ctx.status = 404;
    return render(ctx, 'app/error.html', {
      bulmaURL,
      faURL,
      message: 'The app you are looking for could not be found.',
    });
  }

  const blocks = getAppBlocks(app.definition);
  const blockManifests = await BlockVersion.findAll({
    attributes: ['name', 'OrganizationId', 'version', 'layout', 'actions', 'events'],
    include: [
      {
        attributes: ['filename'],
        model: BlockAsset,
        where: {
          BlockVersionId: { [Op.col]: 'BlockVersion.id' },
        },
      },
    ],
    where: {
      [Op.or]: blocks.map(({ type, version }) => {
        const [OrganizationId, name] = parseBlockName(type);
        return { name, OrganizationId, version };
      }),
    },
  });
  const nonce = randomBytes(16).toString('base64');
  const { reportUri, sentryDsn, sentryEnvironment, sentryOrigin } = getSentryClientSettings(
    hostname,
    app.sentryDsn,
    app.sentryEnvironment,
  );

  const defaultLanguage = app.definition.defaultLanguage || defaultLocale;
  const languages = [
    ...new Set([...app.AppMessages.map(({ language }) => language), defaultLanguage]),
  ].sort();
  const [settingsHash, settings] = createSettings(
    {
      apiUrl: host,
      blockManifests: blockManifests.map(
        ({ BlockAssets, OrganizationId, actions, events, layout, name, version }) => ({
          name: `@${OrganizationId}/${name}`,
          version,
          layout,
          actions,
          events,
          files: BlockAssets.map(({ filename }) => filename),
        }),
      ),
      id: app.id,
      languages,
      logins: [
        ...app.AppOAuth2Secrets.map(({ icon, id, name }) => ({ icon, id, name, type: 'oauth2' })),
        ...app.AppSamlSecrets.map(({ icon, id, name }) => ({ icon, id, name, type: 'saml' })),
      ],
      vapidPublicKey: app.vapidPublicKey,
      definition: app.definition,
      showAppsembleLogin: app.showAppsembleLogin ?? false,
      showAppsembleOAuth2Login: app.showAppsembleOAuth2Login ?? true,
      sentryDsn,
      sentryEnvironment,
      appUpdated: app.updated.toISOString(),
    },
    app.googleAnalyticsID ? createGtagCode(app.googleAnalyticsID) : undefined,
  );
  const csp = {
    'report-uri': [reportUri],
    'connect-src': ['*', 'blob:', 'data:', sentryOrigin, sentryDsn && 'https://sentry.io'],
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      settingsHash,
      app.googleAnalyticsID && 'https://www.googletagmanager.com',
      // This is needed for Webpack.
      process.env.NODE_ENV !== 'production' && "'unsafe-eval'",
    ],
    'img-src': ['*', 'blob:', 'data:', host],
    'media-src': ['*', 'blob:', 'data:', host],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ['*', 'data:'],
    'frame-src': ["'self'", '*.vimeo.com', '*.youtube.com'],
  };

  ctx.set('Content-Security-Policy', makeCSP(csp));

  const url = new URL(host);
  url.hostname = app.domain || `${appPath}.${organizationId}.${url.hostname}`;
  const appUrl = String(url);

  return render(ctx, 'app/index.html', {
    app,
    appUrl,
    host,
    locale: defaultLanguage,
    locales: languages.filter((lang) => lang !== defaultLanguage),
    bulmaURL: createThemeURL(mergeThemes(app.definition.theme)),
    faURL,
    nonce,
    settings,
    themeColor: app.definition.theme?.themeColor || '#ffffff',
    appUpdated: app.updated.toISOString(),
  });
}
