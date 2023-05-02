import { Permission } from '@appsemble/utils';
import { notFound } from '@hapi/boom';
import { type Context } from 'koa';

import { App } from '../models/index.js';
import { checkRole } from '../utils/checkRole.js';

export async function getSSLSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'sslCertificate', 'sslKey'],
  });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.EditAppSettings);

  ctx.body = {
    key: app.sslKey,
    certificate: app.sslCertificate,
  };
}

export async function updateSSLSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { certificate, key },
    },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['domain', 'id', 'OrganizationId'] });

  if (!app) {
    throw notFound('App not found');
  }

  await app.update({
    sslCertificate: certificate?.trim() || null,
    sslKey: key?.trim() || null,
  });

  await checkRole(ctx, app.OrganizationId, Permission.EditAppSettings);

  ctx.body = {
    certificate: app.sslCertificate,
    key: app.sslKey,
  };
}
