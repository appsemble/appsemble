import Boom from 'boom';
import getRawBody from 'raw-body';

export async function getOne(ctx) {
  const { id } = ctx.params;
  const { Asset } = ctx.state.db;

  const asset = await Asset.findById(id);

  if (!asset) {
    throw Boom.notFound('Asset not found');
  }

  ctx.set('Content-Type', asset.mime || 'application/octet-stream');
  ctx.body = asset.data;
}

export async function create(ctx) {
  const { Asset } = ctx.state.db;
  const data = await getRawBody(ctx.req);
  const asset = await Asset.create({ mime: ctx.request.type, data }, { raw: true });

  ctx.status = 201;
  ctx.body = { id: asset.id };
}
