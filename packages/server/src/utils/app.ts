import { URL } from 'url';

import { UserInfo } from '@appsemble/types';
import {
  extractAppMessages,
  has,
  objectCache,
  RemapperContext,
  validateLanguage,
} from '@appsemble/utils';
import { badRequest } from '@hapi/boom';
import memoizeIntlConstructor from 'intl-format-cache';
import { IntlMessageFormat } from 'intl-messageformat';
import tags from 'language-tags';
import { FindOptions, IncludeOptions, Op } from 'sequelize';

import { App, AppMessages } from '../models';
import { KoaContext } from '../types';
import { argv } from './argv';
import { mergeMessages } from './mergeMessages';

const formatters = {
  getNumberFormat: memoizeIntlConstructor(Intl.NumberFormat),
  getDateTimeFormat: memoizeIntlConstructor(Intl.DateTimeFormat),
  getPluralRules: memoizeIntlConstructor(Intl.PluralRules),
};

interface GetAppValue {
  /**
   * The app for the request context.
   */
  app?: App;

  /**
   * The path of the app being requested.
   */
  appPath?: string;

  /**
   * The organization Id of the app being requested.
   */
  organizationId?: string;
}

/**
 * Get an app from the database based on the Koa context and URL.
 *
 * @param ctx - The Koa context.
 * @param queryOptions - Additional Sequelize query options. `where` will be overwritten.
 * @param url - The URL to find the app for. This defaults to the context request origin.
 * @returns The app matching the url.
 */
export async function getApp(
  { origin }: Pick<KoaContext, 'origin'>,
  queryOptions: FindOptions,
  url = origin,
): Promise<GetAppValue> {
  const platformHost = new URL(argv.host).hostname;
  const { hostname } = new URL(url);

  const value: GetAppValue = {
    app: undefined,
    appPath: undefined,
    organizationId: undefined,
  };

  if (hostname.endsWith(`.${platformHost}`)) {
    const subdomain = hostname
      .slice(0, Math.max(0, hostname.length - platformHost.length - 1))
      .split('.');
    if (subdomain.length === 1) {
      [value.organizationId] = subdomain;
    } else if (subdomain.length === 2) {
      [value.appPath, value.organizationId] = subdomain;
      value.app = await App.findOne({
        ...queryOptions,
        where: { path: value.appPath, OrganizationId: value.organizationId },
      });
    }
  } else {
    value.app = await App.findOne({
      ...queryOptions,
      where: { domain: hostname },
    });
  }
  return value;
}

/**
 * Get a context for remappers based on an app definition.
 *
 * This allows to use remappers with the context of an app on the server.
 *
 * @param app - The app for which to get the remapper context.
 * @param language - The preferred language for the context.
 * @param userInfo - The OAuth2 compatible user information.
 * @returns A localized remapper context for the app.
 */
export async function getRemapperContext(
  app: App,
  language: string,
  userInfo: UserInfo,
): Promise<RemapperContext> {
  const languages = language.toLowerCase().split(/-/g);
  const appMessages = await AppMessages.findAll({
    order: [['language', 'desc']],
    where: {
      AppId: app.id,
      language: { [Op.or]: languages.map((lang, i) => languages.slice(0, i + 1).join('-')) },
    },
  });
  const cache = objectCache(
    (message) => new IntlMessageFormat(message, language, undefined, { formatters }),
  );
  return {
    appId: app.id,
    getMessage({ defaultMessage, id }) {
      const msg = appMessages.find(({ messages }) => has(messages.messageIds, id));
      const message = msg ? msg.messages.messageIds[id] : defaultMessage;
      return cache(message || `'{${id}}'`);
    },
    userInfo,
    context: {},
  };
}

/**
 * Sort apps by rating, in descending order.
 *
 * @param a - The first app to compare.
 * @param b - The second app to compare.
 * @returns Whether the first or second app goes first in terms of sorting.
 */
export function compareApps(a: App, b: App): number {
  if (a.RatingAverage != null && b.RatingAverage != null) {
    return b.RatingAverage - a.RatingAverage || b.RatingCount - a.RatingCount;
  }

  if (a.RatingAverage == null && b.RatingAverage == null) {
    return 0;
  }

  return a.RatingAverage == null ? 1 : -1;
}

/**
 * Extracts and parses the language from the query string of a request.
 *
 * @param ctx - Koa context of the request to extract the languages of
 * @returns An object containing the language, base language, and Sequelize filter
 * to filter AppMessages by these languages.
 */
export function parseLanguage(ctx: KoaContext): {
  language: string;
  baseLanguage: string;
  query: IncludeOptions[];
} {
  const {
    query: { language },
  } = ctx;

  if (!language) {
    return { language: undefined, baseLanguage: undefined, query: [] };
  }

  try {
    validateLanguage(language as string);
  } catch {
    throw badRequest(`Language “${language}” is invalid`);
  }

  const lang = (language as string)?.toLowerCase();
  const baseLanguage = String(
    tags(language as string)
      .subtags()
      .find((sub) => sub.type() === 'language'),
  ).toLowerCase();
  const query = (
    language
      ? [
          {
            model: AppMessages,
            where: {
              language:
                baseLanguage && baseLanguage !== lang ? { [Op.or]: [baseLanguage, lang] } : lang,
            },
            required: false,
          },
        ]
      : []
  ) as IncludeOptions[];

  return { language: lang, baseLanguage, query };
}

/**
 * Applies `messages` property to an app model instance
 * based on the included `AppMessages` and languages.
 *
 * Note that this mutates `app`.
 *
 * @param app - The app to apply the messages to.
 * @param language - The language to search for within AppMessages.
 * @param baseLanguage - The base language to search for within AppMessages.
 */
export function applyAppMessages(app: App, language: string, baseLanguage: string): void {
  if (app.AppMessages?.length) {
    const baseMessages =
      baseLanguage && app.AppMessages.find((messages) => messages.language === baseLanguage);
    const languageMessages = app.AppMessages.find((messages) => messages.language === language);

    Object.assign(app, {
      messages: mergeMessages(
        extractAppMessages(app.definition),
        baseMessages?.messages ?? {},
        languageMessages?.messages ?? {},
      ),
    });
  }
}
