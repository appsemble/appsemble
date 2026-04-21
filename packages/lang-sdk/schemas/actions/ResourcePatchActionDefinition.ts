import { RequestActionDefinition } from './RequestActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const ResourcePatchActionDefinition = extendJSONSchema(
  RequestActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.patch'],
        description: 'Patch a resource.',
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to patch.',
      },
      selectedGroupId: {
        $ref: '#/components/schemas/RemapperDefinition',
        description:
          'The ID of the group to scope the request to. Defaults to the currently selected group.',
      },
      ifMatch: {
        $ref: '#/components/schemas/RemapperDefinition',
        description: 'The ETag that must match before updating the resource.',
      },
      id: {
        $ref: '#/components/schemas/RemapperDefinition',
      },
    },
  },
  ['url', 'method'],
);
