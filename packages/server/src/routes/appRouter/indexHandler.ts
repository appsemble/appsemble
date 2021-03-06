import { randomBytes } from 'crypto';
import { URLSearchParams } from 'url';

import { defaultLocale, filterBlocks, getAppBlocks } from '@appsemble/utils';
import { Op } from 'sequelize';

import {
  AppMessages,
  AppOAuth2Secret,
  AppSamlSecret,
  BlockAsset,
  BlockVersion,
} from '../../models';
import { KoaContext } from '../../types';
import { getApp } from '../../utils/app';
import { argv } from '../../utils/argv';
import { organizationBlocklist } from '../../utils/organizationBlocklist';
import { createSettings, makeCSP, render } from '../../utils/render';
import { getSentryClientSettings } from '../../utils/sentry';
import { bulmaURL, faURL } from '../../utils/styleURL';

/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 *
 * @param ctx - The Koa context.
 * @returns void
 */
export async function indexHandler(ctx: KoaContext): Promise<void> {
  const { hostname } = ctx;
  const { host } = argv;

  const { app, appPath, organizationId } = await getApp(ctx, {
    attributes: [
      'definition',
      'id',
      'sharedStyle',
      'coreStyle',
      'vapidPublicKey',
      'showAppsembleLogin',
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

  const blocks = filterBlocks(Object.values(getAppBlocks(app.definition)));
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
        const [org, name] = type.split('/');
        return { name, OrganizationId: org.slice(1), version };
      }),
    },
  });
  const nonce = randomBytes(16).toString('base64');
  const { reportUri, sentryDsn, sentryEnvironment, sentryOrigin } =
    getSentryClientSettings(hostname);
  const [settingsHash, settings] = createSettings({
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
    languages: [
      ...new Set([
        ...app.AppMessages.map(({ language }) => language),
        app.definition.defaultLanguage || defaultLocale,
      ]),
    ].sort(),
    logins: [
      ...app.AppOAuth2Secrets.map(({ icon, id, name }) => ({ icon, id, name, type: 'oauth2' })),
      ...app.AppSamlSecrets.map(({ icon, id, name }) => ({ icon, id, name, type: 'saml' })),
    ],
    vapidPublicKey: app.vapidPublicKey,
    definition: app.definition,
    showAppsembleLogin: app.showAppsembleLogin ?? true,
    sentryDsn,
    sentryEnvironment,
    appUpdated: app.updated.toISOString(),
  });
  const csp = {
    'report-uri': [reportUri],
    'connect-src': ['*', 'blob:', 'data:', sentryOrigin, sentryDsn && 'https://sentry.io'],
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      settingsHash,
      // This is needed for Webpack.
      process.env.NODE_ENV !== 'production' && "'unsafe-eval'",
    ],
    'img-src': ['*', 'blob:', 'data:', host],
    'media-src': ['*', 'blob:', 'data:', host],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'frame-src': ["'self'", '*.vimeo.com', '*.youtube.com'],
  };

  ctx.set('Content-Security-Policy', makeCSP(csp));
  return render(ctx, 'app/index.html', {
    app,
    bulmaURL: `${bulmaURL}?${new URLSearchParams(app.definition.theme)}`,
    faURL,
    nonce,
    settings,
    themeColor: app.definition.theme?.themeColor || '#ffffff',
    appUpdated: app.updated.toISOString(),
  });
}
