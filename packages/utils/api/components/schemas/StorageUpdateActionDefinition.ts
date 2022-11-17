import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const StorageUpdateActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'key', 'value'],
  properties: {
    type: {
      enum: ['storage.update'],
      description: `Update data from an existing dataset in storage

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
      description: 'The key of the item to update.',
    },
    value: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The data to update the specified item with.',
    },
    storage: {
      enum: ['indexedDB', 'localStorage', 'sessionStorage'],
      description: 'The mechanism used to store the data.',
      default: 'indexedDB',
    },
  },
});
