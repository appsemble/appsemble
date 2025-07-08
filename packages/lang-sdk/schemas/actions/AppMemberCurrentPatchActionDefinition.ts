import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const AppMemberCurrentPatchActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['app.member.current.patch'],
      description: `Allows the app member to patch their own app member account.

Does nothing if the app member isn’t logged in.`,
    },
    name: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The new full name of the app member.',
    },
    properties: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: `The updated custom properties for the app member.

Values will be validated based on \`members.properties\`, if defined in the app definition.`,
    },
    picture: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The picture for the patched app member',
    },
  },
});
