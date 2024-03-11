import { randomBytes } from 'node:crypto';

import { assertKoaError, mergeMessages } from '@appsemble/node-utils';
import { extractAppMessages } from '@appsemble/utils';
import { type Context } from 'koa';
import tags from 'language-tags';
import { type FindOptions, type IncludeOptions, Op } from 'sequelize';

import { argv } from './argv.js';
import { App, AppMessages } from '../models/index.js';

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

const localHostnames = new Set(['127.0.0.1', 'localhost']);

/**
 * Get an app from the database based on the Koa context and URL.
 *
 * @param ctx The Koa context.
 * @param queryOptions Additional Sequelize query options. `where` will be overwritten.
 * @param url The URL to find the app for. This defaults to the context request origin.
 * @returns The app matching the url.
 */
export async function getApp(
  { origin }: Pick<Context, 'origin'>,
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

  const { where, ...findOptions } = queryOptions ?? { where: {} };

  if (hostname.endsWith(`.${platformHost}`)) {
    const subdomain = hostname
      .slice(0, Math.max(0, hostname.length - platformHost.length - 1))
      .split('.');
    if (subdomain.length === 1) {
      [value.organizationId] = subdomain;
    } else if (subdomain.length === 2) {
      [value.appPath, value.organizationId] = subdomain;

      value.app = await App.findOne({
        where: {
          path: value.appPath,
          OrganizationId: value.organizationId,
          ...where,
        },
        ...findOptions,
      });
    }
  } else {
    value.app = await App.findOne({
      where: {
        ...(localHostnames.has(hostname) || hostname === platformHost ? {} : { domain: hostname }),
        ...where,
      },
      ...findOptions,
    });
  }
  return value;
}

export function getAppUrl(app: App): URL {
  const url = new URL(argv.host);
  url.hostname = app.domain || `${app.path}.${app.OrganizationId}.${url.hostname}`;
  return url;
}

/**
 * Sort apps by rating, in descending order.
 *
 * @param a The first app to compare.
 * @param b The second app to compare.
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
 * @param ctx Context to throw back the errors in parsing.
 * @param input The language string to parse.
 * @returns An object containing the language, base language, and Sequelize filter
 *   to filter AppMessages by these languages.
 */
export function parseLanguage(
  ctx: Context,
  input: string[] | string,
): {
  language: string;
  baseLanguage: string;
  query: IncludeOptions[];
} {
  const language = Array.isArray(input) ? input[0] : input;
  if (!language) {
    return { language: undefined, baseLanguage: undefined, query: [] };
  }

  assertKoaError(!tags.check(language), ctx, 400, `Language “${language}” is invalid`);

  const lang = language?.toLowerCase();
  const baseLanguage = String(
    tags(language)
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
 * @param app The app to apply the messages to.
 * @param language The language to search for within AppMessages.
 * @param baseLanguage The base language to search for within AppMessages.
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

export async function setAppPath(app: Partial<App>, path: string): Promise<void> {
  for (let i = 1; i < 11; i += 1) {
    const p = i === 1 ? path : `${path}-${i}`;
    const count = await App.count({ where: { path: p } });
    if (count === 0) {
      Object.assign(app, {
        path: p,
      });
      break;
    }
  }

  if (!app.path) {
    // Fallback if a suitable ID could not be found after trying for a while
    Object.assign(app, { path: `${path}-${randomBytes(5).toString('hex')}` });
  }
}
