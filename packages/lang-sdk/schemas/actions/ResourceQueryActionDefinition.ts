import { RequestActionDefinition } from './RequestActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

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
      own: {
        type: 'boolean',
        description:
          'If only the resources created by the authenticated app member should be included',
      },
    },
  },
  ['url', 'method'],
);
