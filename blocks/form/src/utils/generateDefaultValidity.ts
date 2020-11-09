import { Utils } from '@appsemble/sdk';

import { Field, FieldErrorMap } from '../../block';
import { validate } from './validators';

export function generateDefaultValidity(fields: Field[], data: any, utils: Utils): FieldErrorMap {
  return fields.reduce<FieldErrorMap>((acc, field) => {
    const value = data[field.name];
    if (field.type === 'object') {
      if (field.repeated) {
        acc[field.name] = value.map((d: unknown) =>
          generateDefaultValidity(field.fields, d, utils),
        );
      } else {
        acc[field.name] = generateDefaultValidity(field.fields, value, utils);
      }
    } else {
      acc[field.name] = validate(field, value, utils);
    }
    return acc;
  }, {});
}
