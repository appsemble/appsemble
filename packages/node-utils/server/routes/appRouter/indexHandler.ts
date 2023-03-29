import { randomBytes } from 'node:crypto';

import { createThemeURL, defaultLocale, getAppBlocks, mergeThemes } from '@appsemble/utils';
import faPkg from '@fortawesome/fontawesome-free/package.json' assert { type: 'json' };
import bulmaPkg from 'bulma/package.json' assert { type: 'json' };
import { Context, Middleware } from 'koa';

import { organizationBlocklist } from '../../../organizationBlocklist.js';
import { makeCSP, render } from '../../../render.js';
import { AppRouterOptions } from '../types.js';

export const bulmaURL = `/bulma/${bulmaPkg.version}/bulma.min.css`;
export const faURL = `/fa/${faPkg.version}/css/all.min.css`;

export function createIndexHandler({
  createSettings,
  getApp,
  getAppDetails,
  getAppLanguages,
  getAppUrl,
  getCsp,
  getHost,
}: AppRouterOptions): Middleware {
  return async (ctx: Context) => {
    const { hostname, path } = ctx;
    const host = getHost({ context: ctx });

    const app = await getApp({ context: ctx });

    if (!app) {
      const { appPath, organizationId } = await getAppDetails({ context: ctx });

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

    const appUrl = await getAppUrl({ app, context: ctx });

    if (appUrl.hostname !== hostname) {
      appUrl.pathname = path;
      appUrl.search = ctx.querystring;
      ctx.redirect(String(appUrl));
      return;
    }

    const defaultLanguage = app.definition.defaultLanguage || defaultLocale;

    const languages = await getAppLanguages({ app, defaultLanguage, context: ctx });

    const identifiableBlocks = getAppBlocks(app.definition);

    const [settingsHash, settings] = await createSettings({
      context: ctx,
      app,
      host,
      hostname,
      identifiableBlocks,
      languages,
    });

    const nonce = randomBytes(16).toString('base64');

    const csp = getCsp({ app, settingsHash, hostname, host, nonce });
    ctx.set('Content-Security-Policy', makeCSP(csp));

    const updated = app.$updated ? new Date(app.$updated) : new Date();

    return render(ctx, 'app/index.html', {
      app,
      appUrl: String(appUrl),
      host,
      locale: defaultLanguage,
      locales: languages.filter((lang) => lang !== defaultLanguage),
      bulmaURL: createThemeURL(mergeThemes(app.definition.theme)),
      faURL,
      nonce,
      settings,
      themeColor: app.definition.theme?.themeColor || '#ffffff',
      appUpdated: updated.toISOString(),
    });
  };
}
