import type { Parameters } from '@appsemble/sdk';

import { validators } from './validators';

export function generateDefaultValidity(
  parameters: Parameters,
  data: any,
): { [field: string]: boolean } {
  return parameters.fields.reduce<{ [field: string]: boolean }>((acc, field) => {
    const valid = validators[field.type](field, data[field.name]);
    acc[field.name] = valid === undefined;
    return acc;
  }, {});
}
