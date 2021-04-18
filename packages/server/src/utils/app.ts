import { URL } from 'url';

import { UserInfo } from '@appsemble/types';
import { objectCache, RemapperContext } from '@appsemble/utils';
import { notFound } from '@hapi/boom';
import memoizeIntlConstructor from 'intl-format-cache';
import { IntlMessageFormat } from 'intl-messageformat';
import { FindOptions, Op } from 'sequelize';

import { App, AppMessages } from '../models';
import { KoaContext } from '../types';
import { argv } from './argv';

const formatters = {
  getNumberFormat: memoizeIntlConstructor(Intl.NumberFormat),
  getDateTimeFormat: memoizeIntlConstructor(Intl.DateTimeFormat),
  getPluralRules: memoizeIntlConstructor(Intl.PluralRules),
};

/**
 * Get an app from the database based on the Koa context and URL.
 *
 * @param ctx - The Koa context.
 * @param queryOptions - Additional Sequelize query options. `where` will be overwritten.
 * @param url - The URL to find the app for. This defaults to the context request origin.
 *
 * @returns The app matching the url.
 */
export function getApp(
  { origin }: Pick<KoaContext, 'origin'>,
  queryOptions: FindOptions,
  url = origin,
): Promise<App> {
  const platformHost = new URL(argv.host).hostname;
  const { hostname } = new URL(url);

  if (hostname.endsWith(`.${platformHost}`)) {
    const subdomain = hostname
      .slice(0, Math.max(0, hostname.length - platformHost.length - 1))
      .split('.');
    if (subdomain.length !== 2) {
      throw notFound();
    }
    return App.findOne({
      ...queryOptions,
      where: {
        path: subdomain[0],
        OrganizationId: subdomain[1],
      },
    });
  }

  return App.findOne({
    ...queryOptions,
    where: {
      domain: hostname,
    },
  });
}

/**
 * Get a context for remappers based on an app definition.
 *
 * This allows to use remappers with the context of an app on the server.
 *
 * @param app - The app for which to get the remapper context.
 * @param language - The preferred language for the context.
 * @param userInfo - The OAuth2 compatible user information.
 *
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
      const msg = appMessages.find(({ messages }) => Object.hasOwnProperty.call(messages, id));
      const message = msg ? msg.messages[id] : defaultMessage;
      return cache(message);
    },
    userInfo,
    context: {},
  };
}
