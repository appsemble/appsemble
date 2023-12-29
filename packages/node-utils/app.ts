import { type App, type UserInfo } from '@appsemble/types';
import { defaultLocale, has, objectCache, type RemapperContext } from '@appsemble/utils';
import { memoize } from '@formatjs/fast-memoize';
import { IntlMessageFormat } from 'intl-messageformat';
import { type DefaultContext, type DefaultState, type ParameterizedContext } from 'koa';

import { type Options } from './server/types.js';

const getNumberFormat = memoize(
  (locale: string, opts: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale, opts),
);

const getPluralRules = memoize(
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
 * @param options The API utility options.
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
          // @ts-expect-error intl-messageformat types are wrong
          getNumberFormat,
          getPluralRules,
          getDateTimeFormat: memoize(
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
