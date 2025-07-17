import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const StorageAppendActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'key', 'value'],
  properties: {
    type: {
      enum: ['storage.append'],
      description: `Append data to an existing array in storage.
      If the storage entry is a single object, it turns it into an array to append the data on.

For example:
\`\`\`yaml
type: storage.append
key: temp
value: { root }
storage: localStorage
remapBefore:
  object.from:
    text:
      This is a new data item
    value:
      1
\`\`\`
`,
    },
    key: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The key of the storage entry.',
    },
    value: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The data to write on top of the storage entry.',
    },
    storage: {
      enum: ['indexedDB', 'localStorage', 'sessionStorage', 'appStorage'],
      description: 'The mechanism used to store the data.',
      default: 'indexedDB',
    },
  },
});
