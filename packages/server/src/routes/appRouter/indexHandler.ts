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
import { createSettings } from '../../utils/createSettings';
import { makeCSP } from '../../utils/makeCSP';
import { sentryDsnToReportUri } from '../../utils/sentryDsnToReportUri';
import { bulmaURL, faURL } from '../../utils/styleURL';

/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 *
 * @param ctx - The Koa context.
 */
export async function indexHandler(ctx: KoaContext): Promise<void> {
  ctx.type = 'text/html';
  const {
    state: { render },
  } = ctx;
  const { host, sentryDsn, sentryEnvironment } = argv;

  const app = await getApp(ctx, {
    attributes: ['definition', 'id', 'sharedStyle', 'coreStyle', 'vapidPublicKey'],
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
    ctx.body = await render('error.html', {
      bulmaURL,
      faURL,
      message: 'The app you are looking for could not be found.',
    });
    ctx.status = 404;
    return;
  }

  const blocks = filterBlocks(Object.values(getAppBlocks(app.definition)));
  const blockManifests = await BlockVersion.findAll({
    attributes: ['name', 'OrganizationId', 'version', 'layout', 'actions', 'events'],
    include: [
      {
        attributes: ['filename'],
        model: BlockAsset,
        where: {
          name: { [Op.col]: 'BlockVersion.name' },
          OrganizationId: { [Op.col]: 'BlockVersion.OrganizationId' },
          version: { [Op.col]: 'BlockVersion.version' },
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
  const sentry = sentryDsnToReportUri(sentryDsn);
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
    sentryDsn,
    sentryEnvironment,
  });
  const csp = {
    'report-uri': [sentry?.reportUri],
    'connect-src': ['*', 'blob:', 'data:', sentry?.origin, sentryDsn && 'https://sentry.io'],
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

  ctx.body = await render('app.html', {
    app,
    bulmaURL: `${bulmaURL}?${new URLSearchParams(app.definition.theme)}`,
    faURL,
    nonce,
    settings,
    themeColor: app.definition.theme?.themeColor || '#ffffff',
  });
  ctx.set('Content-Security-Policy', makeCSP(csp));
}
