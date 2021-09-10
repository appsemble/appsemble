import { BaseActionDefinition } from './BaseActionDefinition';
import { extendJSONSchema } from './utils';

export const StorageReadActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'key'],
  properties: {
    type: {
      enum: ['storage.read'],
      description: 'Read from the app’s storage.',
    },
    key: {
      description: 'The key of the storage entry.',
    },
  },
});
