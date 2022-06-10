import { RequestActionDefinition } from './RequestActionDefinition';
import { extendJSONSchema } from './utils';

export const ResourceQueryActionDefinition = extendJSONSchema(
  RequestActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.query'],
        description: 'Query a list of resources.',
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to query.',
      },
      view: {
        type: 'string',
        description: 'The view to use for the resource.',
      },
    },
  },
  ['url'],
);
