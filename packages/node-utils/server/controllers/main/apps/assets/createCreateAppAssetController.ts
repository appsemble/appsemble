import { type Context, type Middleware } from 'koa';

import { assertKoaCondition, throwKoaError } from '../../../../../koa.js';
import {
  AssetUploadValidationError,
  validateUploadedFile,
} from '../../../../../uploadValidation.js';
import { type Options } from '../../../../types.js';

export function createCreateAppAssetController({ createAppAsset, getApp }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId },
      request: {
        body: {
          file: { filename, mime, path },
          name,
        },
      },
    } = ctx;

    const app = await getApp({ context: ctx, query: { attributes: ['id'], where: { id: appId } } });

    assertKoaCondition(app != null, ctx, 404, 'App not found');

    let validatedMime: string;
    try {
      validatedMime = await validateUploadedFile({ filename, mime, path });
    } catch (error) {
      if (error instanceof AssetUploadValidationError) {
        throwKoaError(ctx, 400, error.message);
      }
      throw error;
    }

    const asset = await createAppAsset({
      app,
      context: ctx,
      payload: { filename, mime: validatedMime, name, path },
    });

    ctx.status = 201;
    ctx.body = { id: asset.id, mime: asset.mime, filename, name };
  };
}
