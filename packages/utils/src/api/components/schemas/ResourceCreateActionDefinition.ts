import { RequestActionDefinition } from './RequestActionDefinition';
import { extendJSONSchema } from './utils';

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
  ['url'],
);
