import Boom from '@hapi/boom';
import type { FindOptions } from 'sequelize';
import { URL } from 'url';

import { App } from '../models';
import type { KoaContext } from '../types';

/**
 * Get an app from the database based on the Koa context and URL.
 *
 * @param ctx The Koa context.
 * @param queryOptions Additional Sequelize query options. `where` will be overwritten.
 * @param url The URL to find the app for. This defaults to the context request origin.
 *
 * @returns The app matching the url.
 */
export default async function getApp(
  { argv, origin }: Pick<KoaContext, 'argv' | 'origin'>,
  queryOptions: FindOptions,
  url = origin,
): Promise<App> {
  const platformHost = new URL(argv.host).hostname;
  const { hostname } = new URL(url);

  if (hostname.endsWith(`.${platformHost}`)) {
    const subdomain = hostname.substring(0, hostname.length - platformHost.length - 1).split('.');
    if (subdomain.length !== 2) {
      throw Boom.notFound();
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
