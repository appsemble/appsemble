import { RequestActionDefinition } from './RequestActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const ResourceCountActionDefinition = extendJSONSchema(
  RequestActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.count'],
        description:
          'Count the number of resources a similar `resource.query` action would return.',
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to count.',
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
