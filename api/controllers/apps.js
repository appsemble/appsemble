import Boom from 'boom';

export async function create(ctx) {
  const { body } = ctx.request;
  const { App } = ctx.state.db;


  const result = await App.create({ definition: body }, { raw: true });

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
  const { id: _, ...definition } = ctx.request.body;
  const { id } = ctx.params;
  const { App } = ctx.state.db;

  const { affectedRows } = App.update({ definition }, { where: { id } });

  if (affectedRows === 0) {
    throw Boom.notFound('App not found');
  }

  ctx.body = { ...definition, id };
}
