import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const AppMemberPropertiesPatchActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'sub'],
  properties: {
    type: {
      enum: ['app.member.properties.patch'],
      description: `Allows the app member to patch the properties of another app member account.

Does nothing if the app member isn’t logged in.`,
    },
    sub: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The new full name name of the app member.',
    },
    properties: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: `The updated custom properties for the app member.

Values will be validated based on \`members.properties\`, if defined in the app definition.`,
    },
  },
});
