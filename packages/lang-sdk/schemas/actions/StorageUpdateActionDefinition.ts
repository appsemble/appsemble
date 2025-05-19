import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const StorageUpdateActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'key', 'value'],
  properties: {
    type: {
      enum: ['storage.update'],
      description: `Update an existing item in storage, or update an item inside a stored array.

For example:
\`\`\`yaml
type: storage.update
key: temp
item: 1
value: { root }
storage: localStorage
remapBefore:
  object.from:
    text: { prop: text }
    value: { prop: value }
    newField: "New field"
\`\`\`
      `,
    },
    key: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The key of the storage entry.',
    },
    item: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The key of the item in an array to update.',
    },
    value: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The data to update the specified item with.',
    },
    storage: {
      enum: ['indexedDB', 'localStorage', 'sessionStorage', 'appStorage'],
      description: 'The mechanism used to store the data.',
      default: 'indexedDB',
    },
  },
});
