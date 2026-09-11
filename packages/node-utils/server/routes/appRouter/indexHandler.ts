import { createHash, randomBytes } from 'node:crypto';

import { getAppBlocks, type IdentifiableBlock } from '@appsemble/lang-sdk';
import { createThemeURL, defaultLocale, mergeThemes } from '@appsemble/utils';
import { type Context, type Middleware } from 'koa';

import { organizationBlocklist } from '../../../organizationBlocklist.js';
import { makeCSP, render } from '../../../render.js';
import { bulmaVersion, faVersion } from '../../../versions.js';
import { type AppServingCache, type AppServingCacheStatus, type Options } from '../../types.js';

export const bulmaURL = `/bulma/${bulmaVersion}/bulma.min.css`;
export const faURL = `/fa/${faVersion}/css/all.min.css`;

interface CachedSettings {
  settingsHash: string;
  settings: string;
}

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('base64url');
}

function getAppUpdated(app: Awaited<ReturnType<Options['getApp']>>): string {
  return app.$updated ?? '';
}

function getAppSnapshotId(app: Awaited<ReturnType<Options['getApp']>>): number | string {
  return app.version ?? 'none';
}

function getSettingsCacheKey({
  app,
  host,
  hostname,
  identifiableBlocks,
  languages,
}: {
  app: Awaited<ReturnType<Options['getApp']>>;
  host: string;
  hostname: string;
  identifiableBlocks: IdentifiableBlock[];
  languages: string[];
}): string {
  const blocks = identifiableBlocks
    .map(({ type, version }) => ({ type, version }))
    .sort((a, b) => a.type.localeCompare(b.type) || a.version.localeCompare(b.version));

  return [
    'app-settings',
    app.id,
    getAppUpdated(app),
    getAppSnapshotId(app),
    hash({ host, hostname }),
    hash(languages),
    hash(blocks),
  ].join(':');
}

function getMessagesCacheKey({ app }: { app: Awaited<ReturnType<Options['getApp']>> }): string {
  return ['app-messages', app.id, getAppUpdated(app)].join(':');
}

async function getCachedValue<T>(
  cache: AppServingCache | undefined,
  key: string,
  fallback: () => Promise<T>,
): Promise<[value: T, status: AppServingCacheStatus]> {
  if (!cache) {
    return [await fallback(), 'disabled'];
  }

  const cached = await cache.get<T>(key);
  if (cached.status === 'hit') {
    return [cached.value as T, 'hit'];
  }

  const value = await fallback();
  if (cached.status === 'miss') {
    const setStatus = await cache.set(key, value);
    return [value, setStatus === 'error' ? 'error' : 'miss'];
  }

  return [value, cached.status];
}

export function createIndexHandler(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      appServingCache,
      createSettings,
      getApp,
      getAppDetails,
      getAppMessages,
      getAppUrl,
      getCsp,
      getHost,
    } = options;
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
    const [appMessages, messagesCacheStatus] = await getCachedValue(
      appServingCache,
      getMessagesCacheKey({ app }),
      () => getAppMessages({ app, context: ctx }),
    );
    ctx.set('X-Appsemble-Messages-Cache', messagesCacheStatus);

    const languages = [
      ...new Set([...appMessages.map(({ language }) => language), defaultLanguage]),
    ].sort();

    const identifiableBlocks = getAppBlocks(app.definition);

    const nonce = randomBytes(16).toString('base64');

    const [{ settingsHash, settings }, settingsCacheStatus] = await getCachedValue<CachedSettings>(
      appServingCache,
      getSettingsCacheKey({ app, host, hostname, identifiableBlocks, languages }),
      async () => {
        const [digest, script] = await createSettings({
          context: ctx,
          app,
          host,
          hostname,
          identifiableBlocks,
          languages,
          nonce,
        });
        return { settingsHash: digest, settings: script };
      },
    );
    ctx.set('X-Appsemble-Settings-Cache', settingsCacheStatus);

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
