import { getMin, getMinLength } from './requirements.js';
import { type Field, type Values } from '../../block.js';

function generateDefaultValue(field: Field): unknown {
  if ('defaultValue' in field) {
    return field.defaultValue;
  }

  switch (field.type) {
    case 'boolean':
      return false;
    case 'date':
      return new Date().toISOString();
    case 'number':
      return field.display === 'slider' ? getMin(field) : undefined;
    case 'string':
    case 'markdown':
      return '';
    case 'file':
      return field.repeated ? [] : null;
    case 'geocoordinates':
      return {};
    case 'tags':
      return [];
    case 'selection':
      return [];
    case 'fieldset': {
      if (!field.repeated) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return generateDefaultValues(field.fields);
      }
      const length = getMinLength(field);
      if (!length) {
        return [];
      }
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      const values = generateDefaultValues(field.fields);
      return Array.from({ length }).map(() => values);
    }
    default:
  }
}

export function generateDefaultValues(fields: Field[] = []): Values {
  const values: Values = {};
  for (const field of fields) {
    values[field.name] = generateDefaultValue(field);
  }
  return values;
}
