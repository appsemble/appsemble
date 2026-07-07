import { RequestActionDefinition } from './RequestActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const ResourceDeleteAllActionDefinition = extendJSONSchema(
  RequestActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.delete.all'],
        description: `Delete all instances of a resource.
> **Warning!**
>
> Use this action with caution to avoid losing precious data!`,
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to delete.',
      },
      selectedGroupId: {
        $ref: '#/components/schemas/RemapperDefinition',
        description:
          'The ID of the group to scope the request to. Defaults to the currently selected group.',
      },
    },
  },
  ['url', 'method'],
);
