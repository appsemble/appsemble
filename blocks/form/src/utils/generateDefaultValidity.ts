import { Remapper, Utils } from '@appsemble/sdk';

import { Field, FieldErrorMap } from '../../block';
import { validate } from './validators';

export function generateDefaultValidity(
  fields: Field[],
  data: any,
  utils: Utils,
  defaultError: Remapper,
): FieldErrorMap {
  return fields.reduce<FieldErrorMap>((acc, field) => {
    const value = data[field.name];
    if (field.type === 'object') {
      if (field.repeated) {
        acc[field.name] = value.map((d: unknown) =>
          generateDefaultValidity(field.fields, d, utils, defaultError),
        );
      } else {
        acc[field.name] = generateDefaultValidity(field.fields, value, utils, defaultError);
      }
    } else {
      acc[field.name] = validate(field, value, utils, defaultError);
    }
    return acc;
  }, {});
}
