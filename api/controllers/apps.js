import normalize from '@appsemble/utils/normalize';
import Boom from 'boom';
import getRawBody from 'raw-body';
import { UniqueConstraintError } from 'sequelize';

export async function create(ctx) {
  const { body } = ctx.request;
  const { name } = body;
  const { id, url = normalize(name), ...definition } = body;
  const { App } = ctx.state.db;

  let result;
  try {
    result = await App.create({ definition, url }, { raw: true });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw Boom.conflict(`Another app with url “${url}” already exists`);
    }
    throw error;
  }

  ctx.body = {
    ...body,
    id: result.id,
    url,
  };

  ctx.status = 201;
}

export async function getOne(ctx) {
  const { id } = ctx.params;
  const { App } = ctx.state.db;

  const app = await App.findById(id, { raw: true });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  ctx.body = { ...app.definition, id, url: app.url };
}

export async function query(ctx) {
  const { App } = ctx.state.db;

  const apps = await App.findAll({ raw: true });
  ctx.body = apps.map(app => ({ ...app.definition, id: app.id, url: app.url }));
}

export async function update(ctx) {
  const { body } = ctx.request;
  const { name } = body;
  const { id: _, url = normalize(name), ...definition } = body;
  const { id } = ctx.params;
  const { App } = ctx.state.db;

  let affectedRows;
  try {
    [affectedRows] = await App.update({ definition, url }, { where: { id } });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw Boom.conflict(`Another app with url “${url}” already exists`);
    }
    throw error;
  }

  if (affectedRows === 0) {
    throw Boom.notFound('App not found');
  }

  ctx.body = { ...definition, id, url };
}

export async function setAppIcon(ctx) {
  const { id } = ctx.params;
  const { App } = ctx.state.db;
  const icon = await getRawBody(ctx.req);

  const [affectedRows] = await App.update({ icon }, { where: { id } });

  if (affectedRows === 0) {
    throw Boom.notFound('App not found');
  }

  ctx.status = 204;
}

export async function deleteAppIcon(ctx) {
  const { id } = ctx.params;
  const { App } = ctx.state.db;

  const [affectedRows] = await App.update({ icon: null }, { where: { id } });

  if (affectedRows === 0) {
    throw Boom.notFound('App not found');
  }

  ctx.status = 204;
}
