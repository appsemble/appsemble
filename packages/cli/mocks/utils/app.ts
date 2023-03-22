import { Context } from 'koa';

import { FindOptions } from '../db/index.js';
import { App } from '../db/models/App.js';

const HOST = 'localhost';

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
   * The organization id of the app being requested.
   */
  organizationId?: string;
}

/**
 * Get an app from the database based on the Koa context and URL.
 *
 * @param ctx The Koa context.
 * @param queryOptions Additional query options. `where` will be overwritten.
 * @param url The URL to find the app for. This defaults to the context request origin.
 * @returns The app matching the url.
 */
export async function getApp(
  { origin }: Pick<Context, 'origin'>,
  queryOptions: Omit<FindOptions, 'where'>,
  url = origin,
): Promise<GetAppValue> {
  const platformHost = new URL(HOST).hostname;
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

export function getAppUrl(app: App): URL {
  const url = new URL(HOST);
  url.hostname = app.domain || `${app.path}.${app.OrganizationId}.${url.hostname}`;
  return url;
}
