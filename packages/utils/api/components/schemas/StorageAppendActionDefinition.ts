import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const StorageAppendActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'key', 'value'],
  properties: {
    type: {
      enum: ['storage.append'],
      description:
        'Append data to an existing dataset in storage. If the data is a single object, it turns it into an array to append the data onto.',
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
