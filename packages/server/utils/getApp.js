import Boom from '@hapi/boom';

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
      domain: url,
    },
  });
}
