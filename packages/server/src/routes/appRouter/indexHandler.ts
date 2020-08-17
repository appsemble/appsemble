import crypto from 'crypto';
import qs from 'querystring';

import { filterBlocks, getAppBlocks } from '@appsemble/utils';
import { Op } from 'sequelize';

import { AppMessages, AppOAuth2Secret, BlockAsset, BlockVersion } from '../../models';
import type { KoaContext } from '../../types';
import { getApp } from '../../utils/app';
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
    argv: { host, sentryDsn },
    state: { render },
  } = ctx;

  const app = await getApp(ctx, {
    attributes: ['definition', 'id', 'sharedStyle', 'style', 'vapidPublicKey'],
    include: [
      {
        attributes: ['icon', 'id', 'name'],
        model: AppOAuth2Secret,
      },
      {
        attributes: ['language'],
        model: AppMessages,
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
  const nonce = crypto.randomBytes(16).toString('base64');
  const reportUri = sentryDsnToReportUri(sentryDsn);
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
    languages: app.AppMessages.map(({ language }) => language),
    logins: app.AppOAuth2Secrets,
    vapidPublicKey: app.vapidPublicKey,
    definition: app.definition,
    sentryDsn,
  });
  const csp = {
    'report-uri': [reportUri],
    'connect-src': ['*', 'blob:', 'data:'],
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
    bulmaURL: `${bulmaURL}?${qs.stringify(app.definition.theme)}`,
    faURL,
    nonce,
    settings,
    themeColor: app.definition.theme?.themeColor || '#ffffff',
  });
  ctx.set('Content-Security-Policy', makeCSP(csp));
}
