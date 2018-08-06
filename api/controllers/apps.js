const apps = [];


export async function create(ctx) {
  const { body } = ctx.request;
  apps.push(body);
  ctx.body = {
    ...body,
    id: apps.indexOf(body),
  };
}


export async function getOne(ctx) {
  const { id } = ctx.params;
  const app = apps[id];
  if (app != null) {
    ctx.body = {
      ...app,
      id,
    };
  }
}


export async function query(ctx) {
  ctx.body = apps.map((app, id) => ({
    ...app,
    id,
  }));
}
