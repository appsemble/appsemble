import { BaseActionDefinition } from './BaseActionDefinition';
import { extendJSONSchema } from './utils';

export const StorageReadActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'key'],
  properties: {
    type: {
      enum: ['storage.read'],
      description: 'Read data from the app’s local storage.',
    },
    key: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The key of the storage entry.',
    },
    storage: {
      enum: ['indexedDB', 'localStorage', 'sessionStorage'],
      description: 'The mechanism used to read the data from.',
      default: 'indexedDB',
    },
  },
});
