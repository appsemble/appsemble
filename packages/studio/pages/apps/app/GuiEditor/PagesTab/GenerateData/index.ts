import { Schema } from 'jsonschema';
import { JsonValue } from 'type-fest';

export const generateData = (schema: Schema): JsonValue => {
  switch (schema.type) {
    case 'object':
      // eslint-disable-next-line no-case-declarations
      const data: Record<string, JsonValue> = {};
      if (typeof schema.required !== 'boolean' && schema.required?.length) {
        for (const key of schema.required || []) {
          data[key] = generateData(schema.properties![key]);
        }
      }
      return data;
    case 'array':
      return [generateData(schema.items as Schema)];
    case 'string':
      return '';
    case 'integer':
    case 'number':
      // eslint-disable-next-line no-case-declarations
      const {
        maximum = 0,
        minimum = 0,
        multipleOf = schema.type === 'integer' ? 1 : undefined,
      } = schema;
      if (minimum > 0) {
        return multipleOf ? minimum + multipleOf - (minimum % multipleOf) : minimum;
      }
      if (maximum < 0) {
        return multipleOf ? maximum - multipleOf + (-maximum % multipleOf) : maximum;
      }
      return 0;
    case 'boolean':
      return false;
    case 'remapper':
      return '';
    default:
      return null;
  }
};
