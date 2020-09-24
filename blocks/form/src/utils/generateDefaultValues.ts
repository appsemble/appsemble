import type { Field } from '../../block';

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
    case 'object':
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return generateDefaultValues(field.fields);
    default:
      return null;
  }
}

export function generateDefaultValues(fields: Field[]): { [field: string]: unknown } {
  return fields.reduce<{ [key: string]: unknown }>((acc, field) => {
    acc[field.name] = generateDefaultValue(field);
    return acc;
  }, {});
}
