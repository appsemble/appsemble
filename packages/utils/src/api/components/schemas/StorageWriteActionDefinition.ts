import { BaseActionDefinition } from './BaseActionDefinition';
import { extendJSONSchema } from './utils';

export const StorageWriteActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'key', 'value'],
  properties: {
    type: {
      enum: ['storage.write'],
      description: 'Write data to the app’s local storage.',
    },
    key: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The key of the storage entry.',
    },
    value: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The data to write to the storage entry.',
    },
    storage: {
      enum: ['indexedDB', 'localStorage', 'sessionStorage'],
      description: 'The mechanism used to store the data.',
      default: 'indexedDB',
    },
  },
});
