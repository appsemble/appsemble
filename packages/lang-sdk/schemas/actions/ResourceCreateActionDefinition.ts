import { RequestActionDefinition } from './RequestActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const ResourceCreateActionDefinition = extendJSONSchema(
  RequestActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.create'],
        description: 'Create a resource.',
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to create.',
      },
    },
  },
  ['url', 'method'],
);
