import Boom from '@hapi/boom';

/**
 * Get an app from the database based on the Koa context and URL.
 *
 * @param ctx The Koa context.
 * @param queryOptions Additional Sequelize query options. `where` will be overwritten.
 * @param url The URL to find the app for. This defaults to the context request origin.
 *
 * @returns The app matching the url.
 */
export default async function getApp({ argv, db, origin }, queryOptions, url = origin) {
  const { App } = db.models;

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
