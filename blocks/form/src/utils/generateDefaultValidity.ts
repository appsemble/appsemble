import type { Utils } from '@appsemble/sdk';

import type { Field, FieldErrorMap } from '../../block';
import { validate } from './validators';

export function generateDefaultValidity(fields: Field[], data: any, utils: Utils): FieldErrorMap {
  return fields.reduce<FieldErrorMap>((acc, field) => {
    if (field.type === 'object') {
      acc[field.name] = generateDefaultValidity(field.fields, data[field.name], utils);
    } else {
      acc[field.name] = validate(field, data[field.name], utils);
    }
    return acc;
  }, {});
}
