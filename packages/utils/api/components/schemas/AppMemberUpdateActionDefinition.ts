import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const AppMemberUpdateActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['app.member.update'],
      description: `Allows the app member to update another app member or themselves.

Does nothing if the app member isn’t logged in.`,
    },
    id: {
      description: 'The id of the app member.',
    },
    name: {
      description: 'The new full name name of the app member.',
    },
    properties: {
      description: `The updated custom properties for the app member.

Values will be validated based on \`members.properties\`, if defined in the app definition.`,
    },
    role: {
      description:
        "The role for the updated app member. Defaults to the default role in the app's security definition.",
    },
  },
});
