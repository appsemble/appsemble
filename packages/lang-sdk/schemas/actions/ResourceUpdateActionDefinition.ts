import { RequestActionDefinition } from './RequestActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const ResourceUpdateActionDefinition = extendJSONSchema(
  RequestActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.update'],
        description: 'Update a resource.',
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to update.',
      },
      selectedGroupId: {
        $ref: '#/components/schemas/RemapperDefinition',
        description:
          'The ID of the group to scope the request to. Defaults to the currently selected group.',
      },
      optimistic: {
        type: 'object',
        additionalProperties: false,
        description:
          'Fetch the latest resource before writing, merge its `$etag` into the request data so the implicit `If-Match` precondition holds, and retry on precondition conflicts. The fetched resource is also exposed to remappers as `{ context: resource }`.',
        properties: {
          retries: {
            type: 'integer',
            minimum: 0,
            default: 0,
            description:
              'The number of precondition conflicts to retry after fetching the latest resource again.',
          },
        },
      },
    },
  },
  ['url', 'method'],
);
