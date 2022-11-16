import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const StorageRemoveActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'key'],
  properties: {
    type: {
      enum: ['storage.remove'],
      description: 'Remove the dataset that is stored at the specified key.',
    },
    key: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The key of the storage entry to remove.',
    },
    storage: {
      enum: ['indexedDB', 'localStorage', 'sessionStorage'],
      description: 'The mechanism used to remove the data from.',
      default: 'indexedDB',
    },
  },
});
