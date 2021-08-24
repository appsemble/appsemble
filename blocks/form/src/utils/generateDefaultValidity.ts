import { Remapper, Utils } from '@appsemble/sdk';

import { Field, FieldErrorMap } from '../../block';
import { validate } from './validators';

export function generateDefaultValidity(
  fields: Field[],
  data: any,
  utils: Utils,
  defaultError: Remapper,
): FieldErrorMap {
  const validity: FieldErrorMap = {};
  for (const field of fields) {
    const value = data[field.name];
    if (field.type === 'object') {
      if (field.repeated) {
        validity[field.name] = value.map((d: unknown) =>
          generateDefaultValidity(field.fields, d, utils, defaultError),
        );
      } else {
        validity[field.name] = generateDefaultValidity(field.fields, value, utils, defaultError);
      }
    } else {
      validity[field.name] = validate(field, value, utils, defaultError);
    }
  }
  return validity;
}
