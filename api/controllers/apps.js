import normalize from '@appsemble/utils/normalize';
import Boom from 'boom';
import getRawBody from 'raw-body';
import { UniqueConstraintError } from 'sequelize';
import sharp from 'sharp';

import getDefaultIcon from '../utils/getDefaultIcon';

export async function create(ctx) {
  const { body } = ctx.request;
  const { name } = body;
  const { id, path = normalize(name), ...definition } = body;
  const { App } = ctx.db.models;

  let result;
  try {
    result = await App.create({ definition, path }, { raw: true });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw Boom.conflict(`Another app with path “${path}” already exists`);
    }
    throw error;
  }

  ctx.body = {
    ...body,
    id: result.id,
    path,
  };

  ctx.status = 201;
}

export async function getOne(ctx) {
  const { id } = ctx.params;
  const { App } = ctx.db.models;

  const app = await App.findByPk(id, { raw: true });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  ctx.body = { ...app.definition, id, path: app.path };
}

export async function query(ctx) {
  const { App } = ctx.db.models;

  const apps = await App.findAll({ raw: true });
  ctx.body = apps.map(app => ({ ...app.definition, id: app.id, path: app.path }));
}

export async function update(ctx) {
  const { body } = ctx.request;
  const { name } = body;
  const { id: _, path = normalize(name), ...definition } = body;
  const { id } = ctx.params;
  const { App } = ctx.db.models;

  let affectedRows;
  try {
    [affectedRows] = await App.update({ definition, path }, { where: { id } });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw Boom.conflict(`Another app with path “${path}” already exists`);
    }
    throw error;
  }

  if (affectedRows === 0) {
    throw Boom.notFound('App not found');
  }

  ctx.body = { ...definition, id, path };
}

export async function getAppIcon(ctx) {
  const { id } = ctx.params;
  const { App } = ctx.db.models;
  const app = await App.findByPk(id, { raw: true });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  const icon = app.icon || getDefaultIcon();
  const metadata = await sharp(icon).metadata();

  ctx.body = icon;
  // Type svg resolves to text/xml instead of image/svg+xml.
  ctx.type = metadata.format === 'svg' ? 'image/svg+xml' : metadata.format;
}

export async function setAppIcon(ctx) {
  const { id } = ctx.params;
  const { App } = ctx.db.models;
  const icon = await getRawBody(ctx.req);

  const [affectedRows] = await App.update({ icon }, { where: { id } });

  if (affectedRows === 0) {
    throw Boom.notFound('App not found');
  }

  ctx.status = 204;
}

export async function deleteAppIcon(ctx) {
  const { id } = ctx.params;
  const { App } = ctx.db.models;

  const [affectedRows] = await App.update({ icon: null }, { where: { id } });

  if (affectedRows === 0) {
    throw Boom.notFound('App not found');
  }

  ctx.status = 204;
}
