import Boom from 'boom';

import {
  insert,
  select,
  update as sqlUpdate,
} from '../utils/db';


function rowToJson(row) {
  return {
    authentication: JSON.parse(row.authentication),
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
  ctx.status = 201;
}


export async function getOne(ctx) {
  const { id } = ctx.params;
  const apps = await select('App', { id });
  if (apps.length === 0) {
    throw Boom.notFound('App not found');
  }
  const [app] = apps;
  ctx.body = rowToJson(app);
}


export async function query(ctx) {
  const apps = await select('App');
  ctx.body = apps.map(rowToJson);
}


export async function update(ctx) {
  const { body } = ctx.request;
  const { id } = ctx.params;
  const { affectedRows } = await sqlUpdate('App', body, { id });
  if (affectedRows === 0) {
    throw Boom.notFound('App not found');
  }
  ctx.body = body;
}
