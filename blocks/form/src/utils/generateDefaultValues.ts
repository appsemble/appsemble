import type { Parameters } from '@appsemble/sdk';

export default function generateDefaultValues(parameters: Parameters): { [field: string]: any } {
  return parameters.fields.reduce((acc, field) => {
    if ('defaultValue' in field) {
      acc[field.name] = field.defaultValue;
    } else if (field.type === 'string') {
      acc[field.name] = '';
    } else if (field.type === 'boolean') {
      acc[field.name] = false;
    } else if (
      field.type === 'enum' ||
      field.type === 'hidden' ||
      field.type === 'integer' ||
      field.type === 'number'
    ) {
      acc[field.name] = null;
    } else if (field.type === 'geocoordinates') {
      acc[field.name] = {};
    } else if (field.type === 'file' && field.repeated) {
      acc[field.name] = [];
    } else {
      acc[field.name] = null;
    }

    return acc;
  }, {} as { [key: string]: any });
}
