import { Field, Values } from '../../block';
import { getMinLength } from './requirements';

function generateDefaultValue(field: Field): unknown {
  if ('defaultValue' in field) {
    return field.defaultValue;
  }
  switch (field.type) {
    case 'boolean':
      return false;
    case 'string':
      return '';
    case 'file':
      return field.repeated ? [] : null;
    case 'geocoordinates':
      return {};
    case 'object': {
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

export function generateDefaultValues(fields: Field[]): Values {
  return fields.reduce<Values>((acc, field) => {
    acc[field.name] = generateDefaultValue(field);
    return acc;
  }, {});
}
