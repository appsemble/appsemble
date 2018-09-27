import Boom from 'boom';
import { omit } from 'lodash';

export async function create(ctx) {
  const { body } = ctx.request;
  const { App } = ctx.state.db;

  const definition = omit(body, 'id');
  const result = await App.create({ definition }, { raw: true });

  ctx.body = {
    ...body,
    id: result.id,
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

  ctx.body = { ...app.definition, id };
}


export async function query(ctx) {
  const { App } = ctx.state.db;

  const apps = await App.findAll({ raw: true });
  ctx.body = apps.map(app => ({ ...app.definition, id: app.id }));
}


export async function update(ctx) {
  const definition = omit(ctx.request.body, 'id');
  const { id } = ctx.params;
  const { App } = ctx.state.db;

  const [affectedRows] = await App.update({ definition }, { where: { id } });

  if (affectedRows === 0) {
    throw Boom.notFound('App not found');
  }

  ctx.body = { ...definition, id };
}
