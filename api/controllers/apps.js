import Boom from 'boom';

export async function create(ctx) {
  const { body } = ctx.request;
  const { App } = ctx.state.db;

  const result = await App.create(body, { raw: true });
  // const result = await insert('App', body);
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

  ctx.body = app.definition;
}


export async function query(ctx) {
  const { App } = ctx.state.db;

  const apps = await App.findAll({ raw: true });
  ctx.body = apps.map(app => app.definition);
}


export async function update(ctx) {
  const { body } = ctx.request;
  const { id } = ctx.params;
  const { App } = ctx.state.db;

  const { affectedRows } = App.update({ definition: { ...body, id } }, { where: { id } });

  if (affectedRows === 0) {
    throw Boom.notFound('App not found');
  }

  ctx.body = body;
}
