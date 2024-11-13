import { type Context } from 'koa';

export function setHeaders(ctx: Context, mime: string, filename: string | null): void {
  ctx.set('content-type', mime || 'application/octet-stream');
  if (filename) {
    ctx.set(
      'content-disposition',
      `${mime?.startsWith('image') ? 'inline' : 'attachment'}; filename=${JSON.stringify(filename)}`,
    );
  }

  ctx.set('Access-Control-Expose-Headers', 'Content-Disposition');
  ctx.set('Cache-Control', 'max-age=31536000,immutable');
}
