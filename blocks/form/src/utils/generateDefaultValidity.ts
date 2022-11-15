import { Remapper, Utils } from '@appsemble/sdk';

import { Field, FieldErrorMap, Values } from '../../block.js';
import { isRequired } from './requirements.js';
import { validate } from './validators/index.js';

export function generateDefaultValidity(
  fields: Field[],
  data: any,
  utils: Utils,
  defaultError: Remapper,
  defaultValues: Values,
): FieldErrorMap {
  const validity: FieldErrorMap = {};
  if (!fields) {
    return validity;
  }

  for (const field of fields) {
    const value = data[field.name];

    if (!isRequired(field, utils, data) && value === defaultValues[field.name]) {
      // If the user has entered something and then reverted it to its default value,
      // it should be treated as if it’s pristine.
      continue;
    }

    if (field.type === 'object') {
      if (field.repeated) {
        validity[field.name] = value.map((d: unknown) =>
          generateDefaultValidity(
            field.fields,
            d,
            utils,
            defaultError,
            defaultValues[field.name] as Values,
          ),
        );
      } else {
        validity[field.name] = generateDefaultValidity(
          field.fields,
          value,
          utils,
          defaultError,
          defaultValues[field.name] as Values,
        );
      }
    } else {
      validity[field.name] = validate(field, data, utils, defaultError, defaultValues[field.name]);
    }
  }
  return validity;
}
