import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const StorageSubtractActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'key'],
  properties: {
    type: {
      enum: ['storage.subtract'],
      description: `Subtract last item from a storage entry.

If the entry consists of only one item, turns it into a singular object.

If the entry is a single item, the entry is removed entirely.

For example:
\`\`\`yaml
type: storage.subtract
key: temp
storage: localStorage
\`\`\`
        `,
    },
    key: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The key of the storage entry.',
    },
    storage: {
      enum: ['indexedDB', 'localStorage', 'sessionStorage', 'appStorage'],
      description: 'The mechanism used to read the data from.',
      default: 'indexedDB',
    },
  },
});
