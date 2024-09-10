import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const AppMemberRegisterActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'email', 'password'],
  properties: {
    type: {
      enum: ['app.member.register'],
      description: `Allows the app member to register using an email address and a password.

Does nothing if the app member is already logged in.`,
    },
    password: {
      description: 'The password to log in with.',
    },
    email: {
      description: 'The email to log in with.',
    },
    name: {
      description: 'The full name of the app member.',
    },
    picture: {
      description: 'The image to use for the profile picture of the app member.',
    },
    properties: {
      description: `The custom properties for the app member.

Values will be validated based on \`members.properties\`, if defined in the app definition.`,
    },
    login: {
      description: 'Whether to login after registering.',
      default: true,
    },
  },
});
