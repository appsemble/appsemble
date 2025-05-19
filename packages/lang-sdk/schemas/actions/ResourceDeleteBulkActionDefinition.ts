import { RequestActionDefinition } from './RequestActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const ResourceDeleteBulkActionDefinition = extendJSONSchema(
  RequestActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.delete.bulk'],
        description: 'Delete several instances of a resource.',
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to delete.',
      },
    },
  },
  ['url', 'method'],
);
