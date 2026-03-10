import { randomBytes } from 'node:crypto';

import { getAppBlocks } from '@appsemble/lang-sdk';
import { createThemeURL, defaultLocale, mergeThemes } from '@appsemble/utils';
import { type Context, type Middleware } from 'koa';

import { organizationBlocklist } from '../../../organizationBlocklist.js';
import { makeCSP, render } from '../../../render.js';
import { bulmaVersion, faVersion } from '../../../versions.js';
import { type Options } from '../../types.js';

export const bulmaURL = `/bulma/${bulmaVersion}/bulma.min.css`;
export const faURL = `/fa/${faVersion}/css/all.min.css`;

export function createIndexHandler({
  createSettings,
  getApp,
  getAppDetails,
  getAppMessages,
  getAppUrl,
  getCsp,
  getHost,
}: Options): Middleware {
  return async (ctx: Context) => {
    const { hostname, path } = ctx;
    const host = getHost({ context: ctx });
    // Prevent mime-type sniffing,
    // Visit https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options to know more.
    ctx.set('x-content-type-options', 'nosniff');
    // Less strict due to the OAuth mechanism
    // Visit https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy to know more.
    ctx.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Most of the fields here are used either directly or indirectly that's why no attributes query
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
      const redirectUrl = new URL(path, appUrl);
      redirectUrl.search = ctx.search;
      ctx.redirect(String(redirectUrl));
      return;
    }

    const defaultLanguage = app.definition.defaultLanguage || defaultLocale;
    const appMessages = await getAppMessages({ app, context: ctx });

    const languages = [
      ...new Set([...appMessages.map(({ language }) => language), defaultLanguage]),
    ].sort();

    const identifiableBlocks = getAppBlocks(app.definition);

    const nonce = randomBytes(16).toString('base64');

    const [settingsHash, settings] = await createSettings({
      context: ctx,
      app,
      host,
      hostname,
      identifiableBlocks,
      languages,
      nonce,
    });

    const csp = getCsp({ app, settingsHash, hostname, host, nonce });
    ctx.set('Content-Security-Policy', makeCSP(csp));

    const updated = app.$updated ? new Date(app.$updated) : new Date();

    return render(ctx, 'app/index.html', {
      app,
      noIndex: app.visibility !== 'public',
      appUrl: String(appUrl),
      host,
      locale: defaultLanguage,
      locales: languages.filter((lang) => lang !== defaultLanguage),
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      bulmaURL: createThemeURL(mergeThemes(app.definition.theme)),
      faURL,
      nonce,
      settings,
      themeColor: app.definition.theme?.themeColor || '#ffffff',
      appUpdated: updated.toISOString(),
    });
  };
}
