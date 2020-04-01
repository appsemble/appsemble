import { filterBlocks, getAppBlocks } from '@appsemble/utils';
import crypto from 'crypto';
import qs from 'querystring';
import { Op } from 'sequelize';

import createSettings from '../../utils/createSettings';
import getApp from '../../utils/getApp';
import makeCSP from '../../utils/makeCSP';
import sentryDsnToReportUri from '../../utils/sentryDsnToReportUri';
import { bulmaURL, faURL } from '../../utils/styleURL';

/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 */
export default async function indexHandler(ctx) {
  ctx.type = 'text/html';
  const { render } = ctx.state;
  const { BlockAsset, BlockVersion } = ctx.db.models;
  const app = await getApp(ctx, {
    attributes: ['definition', 'id', 'OrganizationId', 'sharedStyle', 'style', 'vapidPublicKey'],
    raw: true,
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
    attributes: ['name', 'version', 'layout', 'actions', 'events'],
    include: [
      {
        attributes: ['filename'],
        model: BlockAsset,
        where: {
          name: { [Op.col]: 'BlockVersion.name' },
          version: { [Op.col]: 'BlockVersion.version' },
        },
      },
    ],
    where: {
      [Op.or]: blocks.map(({ type, version }) => ({ name: type, version })),
    },
  });
  const { host, sentryDsn } = ctx.argv;
  const nonce = crypto.randomBytes(16).toString('base64');
  const reportUri = sentryDsnToReportUri(sentryDsn);
  const [settingsHash, settings] = createSettings({
    apiUrl: host,
    blockManifests: blockManifests.map(
      ({ BlockAssets, actions, events, layout, name, version }) => ({
        name,
        version,
        layout,
        actions,
        events,
        files: BlockAssets.map(({ filename }) => filename),
      }),
    ),
    id: app.id,
    vapidPublicKey: app.vapidPublicKey,
    organizationId: app.OrganizationId,
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
    'style-src': ["'self'", "'unsafe-inline'", host, 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com', host],
    'frame-src': ["'self'", '*.vimeo.com', '*.youtube.com'],
  };

  ctx.body = await render('app.html', {
    app,
    bulmaURL: `${bulmaURL}?${qs.stringify(app.definition.theme)}`,
    faURL,
    nonce,
    settings,
  });
  ctx.set('Content-Security-Policy', makeCSP(csp));
}
