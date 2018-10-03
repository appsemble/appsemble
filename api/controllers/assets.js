import Boom from 'boom';

/**
 * @param {import('koa').Context} ctx
 */
export async function getOne(ctx) {
  const { id } = ctx.params;
  const { Asset } = ctx.state.db;

  const asset = await Asset.findById(id);

  if (!asset) {
    throw Boom.notFound('Asset not found');
  }

  ctx.set('Content-Type', asset.mime);
  ctx.body = asset.data;
}

/**
 * @param {import('koa').Context} ctx
 */
export async function create(ctx) {
  ctx.status = 418;
  ctx.body = 'I am a teapot.';
}
