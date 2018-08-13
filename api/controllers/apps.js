import {
  insert,
  select,
} from '../utils/db';


function rowToJson(row) {
  return {
    defaultPage: row.defaultPage,
    definitions: JSON.parse(row.definitions),
    id: row.id,
    name: row.name,
    pages: JSON.parse(row.pages),
  };
}


export async function create(ctx) {
  const { body } = ctx.request;

  const result = await insert('App', body);
  ctx.body = {
    ...body,
    id: result.insertId,
  };
}


export async function getOne(ctx) {
  const { id } = ctx.params;
  const apps = await select('App', { id });
  if (apps.length === 0) {
    ctx.throw(404);
    return;
  }
  const [app] = apps;
  ctx.body = rowToJson(app);
}


export async function query(ctx) {
  const apps = await select('App');
  ctx.body = apps.map(rowToJson);
}
