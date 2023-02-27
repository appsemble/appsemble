import { Remapper, Utils } from '@appsemble/sdk';

import { Field, FieldErrorMap, Values } from '../../block.js';
import { getValueByNameSequence } from './getNested.js';
import { isRequired } from './requirements.js';
import { validate } from './validators/index.js';

export function generateDefaultValidity(
  fields: Field[],
  data: any,
  utils: Utils,
  defaultError: Remapper,
  defaultValues: Values,
  prefix = '',
): FieldErrorMap {
  const validity: FieldErrorMap = {};
  if (!fields) {
    return validity;
  }

  for (const field of fields) {
    const value = getValueByNameSequence(prefix ? `${prefix}.${field.name}` : field.name, data);

    if (field.type === 'object') {
      validity[field.name] = field.repeated
        ? (value as []).map((d: unknown, index: number) =>
            generateDefaultValidity(
              field.fields,
              data,
              utils,
              defaultError,
              defaultValues[field.name] as Values,
              prefix ? `${prefix}.${field.name}.${index}` : `${field.name}.${index}`,
            ),
          )
        : generateDefaultValidity(
            field.fields,
            data,
            utils,
            defaultError,
            defaultValues[field.name] as Values,
            prefix ? `${prefix}.${field.name}` : field.name,
          );
      return validity;
    }

    if (!isRequired(field, utils, data) && value === defaultValues?.[field.name]) {
      // If the user has entered something and then reverted it to its default value,
      // it should be treated as if it’s pristine.
      continue;
    }

    const fieldValidity = validate(
      field,
      data,
      utils,
      defaultError,
      defaultValues?.[field.name],
      prefix,
    );
    if (typeof fieldValidity === 'string' || typeof fieldValidity === 'boolean') {
      validity[field.name] = fieldValidity;
    }
  }
  return validity;
}
