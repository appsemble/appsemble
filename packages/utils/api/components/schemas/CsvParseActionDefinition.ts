import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const CsvParseActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'file'],
  properties: {
    type: {
      description: 'An action to parse the CSV files',
      enum: ['csv.parse'],
    },
    file: {
      description: 'The CSV file to be parsed',
      $ref: '#/components/schemas/RemapperDefinition',
    },
    delimiter: {
      description: 'The delimiter to be used, defaults to comma(",")',
      $ref: '#/components/schemas/RemapperDefinition',
    },
  },
});
