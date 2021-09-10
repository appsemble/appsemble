import { BaseActionDefinition } from './BaseActionDefinition';
import { extendJSONSchema } from './utils';

export const StorageWriteActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'key', 'value'],
  properties: {
    type: {
      enum: ['storage.write'],
      description: 'Write data to the app’s storage.',
    },
    key: {
      description: 'The key of the storage entry.',
    },
    value: {
      description: 'The data to write to the storage entry.',
    },
  },
});
