import { App, UserInfo } from '@appsemble/types';
import {
  defaultLocale,
  has,
  IntlMessageFormat,
  objectCache,
  RemapperContext,
} from '@appsemble/utils';
import memoize from '@formatjs/fast-memoize';
import { DefaultContext, DefaultState, ParameterizedContext } from 'koa';

import { Options } from './server/types.js';

// @ts-expect-error @formatjs/fast-memoize is typed for faux ESM
const getNumberFormat = memoize.default(
  (locale: string, opts: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale, opts),
);

// @ts-expect-error @formatjs/fast-memoize is typed for faux ESM
const getPluralRules = memoize.default(
  (locale: string, opts: Intl.PluralRulesOptions) => new Intl.PluralRules(locale, opts),
);

/**
 * Get a context for remappers based on an app definition.
 *
 * This allows to use remappers with the context of an app on the server.
 *
 * @param app The app for which to get the remapper context.
 * @param language The preferred language for the context.
 * @param userInfo The OAuth2 compatible user information.
 * @param options The utility options.
 * @param context The koa context.
 * @returns A localized remapper context for the app.
 */
export async function getRemapperContext(
  app: App,
  language: string,
  userInfo: UserInfo,
  options: Options,
  context: ParameterizedContext<DefaultState, DefaultContext, any>,
): Promise<RemapperContext> {
  const { getAppMessages, getAppUrl } = options;

  const appUrl = String(await getAppUrl({ context, app }));
  const appMessages = await getAppMessages({
    app,
    context,
    language,
  });

  const cache = objectCache(
    (message) =>
      new IntlMessageFormat(message, language, undefined, {
        formatters: {
          getNumberFormat,
          getPluralRules,
          // @ts-expect-error @formatjs/fast-memoize is typed for faux ESM
          getDateTimeFormat: memoize.default(
            (locale: string, opts: Intl.DateTimeFormatOptions) =>
              new Intl.DateTimeFormat(locale, { ...opts, timeZone: userInfo?.zoneinfo }),
          ),
        },
      }),
  );

  return {
    appId: app.id,
    appUrl,
    url: appUrl,
    getMessage({ defaultMessage, id }) {
      const msg = appMessages.find(({ messages }) => has(messages.messageIds, id));
      const message = msg ? msg.messages.messageIds[id] : defaultMessage;
      return cache(message || `'{${id}}'`);
    },
    userInfo,
    context: {},
    locale: userInfo?.locale ?? app.definition.defaultLanguage ?? defaultLocale,
  };
}
