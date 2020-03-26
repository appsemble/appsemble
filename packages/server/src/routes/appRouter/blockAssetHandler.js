import Boom from '@hapi/boom';

/**
 * Serve a block asset.
 */
export default async function blockAssetHandler(ctx) {
  const { BlockAsset } = ctx.db.models;
  const { filename, name, version } = ctx.params;

  const blockAsset = await BlockAsset.findOne({
    raw: true,
    attributes: ['mime', 'content'],
    where: { filename, name, version },
  });

  if (!blockAsset) {
    throw Boom.notFound('Block asset not found');
  }

  ctx.body = blockAsset.content;
  ctx.type = blockAsset.mime;
}
