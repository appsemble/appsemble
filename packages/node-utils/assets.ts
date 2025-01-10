import { type Context } from 'koa';
import { type BucketItemStat } from 'minio';

export function setAssetHeaders(
  ctx: Context,
  mime: string,
  filename: string | null,
  stats?: BucketItemStat,
): void {
  ctx.set('content-type', mime || 'application/octet-stream');
  if (filename) {
    ctx.set(
      'content-disposition',
      `${mime?.startsWith('image') ? 'inline' : 'attachment'}; filename=${JSON.stringify(filename)}`,
    );
  }

  if (stats) {
    ctx.set('Content-Length', String(stats.size));
    ctx.set('ETag', stats.etag);
    ctx.set('Last-Modified', stats.lastModified.toUTCString());
  }

  ctx.set('Access-Control-Expose-Headers', 'Content-Disposition');
  ctx.set('Cache-Control', 'max-age=31536000,immutable');
}
