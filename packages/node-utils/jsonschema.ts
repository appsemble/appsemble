import { type ValidatorResult } from 'jsonschema';
import { type Context } from 'koa';

export function handleValidatorResult(
  ctx: Context,
  result: ValidatorResult,
  msg = 'JSON schema validation failed',
): void {
  if (!result.valid) {
    if (ctx.response === undefined) {
      throw new Error(msg, { cause: result.errors });
    }
    ctx.response.status = 400;
    ctx.response.body = {
      statusCode: 400,
      error: 'Bad Request',
      message: msg,
      data: {
        errors: result.errors,
      },
    };
    ctx.throw();
  }
}
