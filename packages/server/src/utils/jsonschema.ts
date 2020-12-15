import { badRequest } from '@hapi/boom';
import { ValidatorResult } from 'jsonschema';

export function handleValidatorResult(
  result: ValidatorResult,
  msg = 'JSON schema validation failed',
): void {
  if (!result.valid) {
    throw badRequest(
      msg,
      result.errors.map(({ argument, message, name, path, schema }) => ({
        argument,
        message,
        name,
        path,
        schema,
      })),
    );
  }
}
