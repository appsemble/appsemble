import { type ValidatorResult } from 'jsonschema';
import { type Context } from 'koa';

import { throwKoaError } from './koa.js';

export function handleValidatorResult(
  ctx: Context,
  result: ValidatorResult,
  msg = 'JSON schema validation failed',
): void {
  if (!result.valid) {
    if (ctx.response === undefined) {
      throw new Error(msg, { cause: result.errors });
    }
    throwKoaError(ctx, 400, msg, { errors: result.errors });
  }
}
