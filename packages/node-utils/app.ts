import { App, AppMessages, UserInfo } from '@appsemble/types';
import {
  defaultLocale,
  has,
  IntlMessageFormat,
  objectCache,
  RemapperContext,
} from '@appsemble/utils';
import memoize from '@formatjs/fast-memoize';

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
 * @param appUrl The base URL of the app.
 * @param appMessages The messages for the app.
 * @param language The preferred language for the context.
 * @param userInfo The OAuth2 compatible user information.
 * @returns A localized remapper context for the app.
 */
export function getRemapperContext(
  app: App,
  appUrl: string,
  appMessages: AppMessages[],
  language: string,
  userInfo: UserInfo,
): RemapperContext {
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
